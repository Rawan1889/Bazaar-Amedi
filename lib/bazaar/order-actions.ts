'use server'

import { revalidatePath } from 'next/cache'
import { createBazaarServer, createBazaarAdmin } from './supabase-server'
import { getBazaarUser } from './auth'
import { sendPushToUser, sendPushToOnlineDrivers } from './push-notifications'
import { applyCoupon } from './coupon-actions'
import { computeDeliveryFee } from './zone-utils'
import { PRODUCT_PRICING_SELECT, priceCartLines, validateCartLines, reserveStock, releaseCounters, type ProductRow } from './order-pricing'

interface CartItemInput {
  productId: string
  variantId?: string
  shopId: string
  name: string
  price: number
  salePrice: number | null
  quantity: number
}

export async function placeOrder(data: {
  items: CartItemInput[]
  deliveryAddress: string
  note: string | null
  couponCode?: string | null
  addressId?: string | null
  deliveryLat?: number | null
  deliveryLng?: number | null
  zoneId?: string | null
  scheduledDate?: string | null
  scheduledSlot?: string | null
  fulfillmentType?: 'delivery' | 'pickup'
}) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Please sign in to place an order.' }
  if (user.role !== 'customer' && user.role !== 'super_admin') {
    return { error: 'Only customers can place orders.' }
  }
  if (user.role === 'customer' && !user.is_approved) {
    return { error: 'Your account is waiting for approval. You can order once the Kela team approves it.' }
  }

  const isPickup = data.fulfillmentType === 'pickup'

  const invalid = validateCartLines(data.items)
  if (invalid) return { error: invalid }

  // Resolve every item's price, shop, and name from the database. Server
  // actions are public endpoints, so nothing price-related from the client
  // can be trusted — only productId, variantId, and quantity are used.
  const admin = createBazaarAdmin()
  const productIds = [...new Set(data.items.map(i => i.productId))]
  const { data: productRows, error: productsError } = await admin
    .from('bazaar_products')
    .select(PRODUCT_PRICING_SELECT)
    .in('id', productIds)
  if (productsError) return { error: 'Could not load products. Please try again.' }
  const priced = priceCartLines(productRows as unknown as ProductRow[], data.items, Date.now())
  if ('error' in priced) return { error: priced.error }
  const items = priced.items

  if (isPickup) {
    if (new Set(items.map(i => i.shopId)).size > 1) {
      return { error: 'Pickup is only available for single-shop orders.' }
    }
  } else if (!data.deliveryAddress.trim()) {
    return { error: 'Delivery address is required.' }
  }

  const supabase = await createBazaarServer()

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)

  // Resolve the delivery fee server-side from the involved zones — never trust
  // a fee from the client. Rule: 1–2 shops pay the farthest zone fee; 3+ shops
  // pay the two farthest zone fees added together (see computeDeliveryFee).
  // Pickup orders have no delivery fee.
  let deliveryFee = isPickup ? 0 : 2500
  if (!isPickup) {
    const shopIds = [...new Set(items.map(i => i.shopId))]
    const { data: shopRows } = await supabase
      .from('bazaar_shops')
      .select('zone_id')
      .in('id', shopIds)
    const shopZoneIds = (shopRows || [])
      .map(r => r.zone_id as string | null)
      .filter((id): id is string => !!id)
    const allZoneIds = [...new Set([data.zoneId, ...shopZoneIds].filter((id): id is string => !!id))]
    const { data: zones } = allZoneIds.length
      ? await supabase
          .from('bazaar_delivery_zones')
          .select('id, fee, min_order, free_delivery_threshold, is_active')
          .in('id', allZoneIds)
      : { data: [] }
    const activeZones = (zones || []).filter(z => z.is_active)
    const customerZone = data.zoneId ? activeZones.find(z => z.id === data.zoneId) ?? null : null

    if (customerZone?.min_order && subtotal < customerZone.min_order) {
      return { error: `Minimum order for this area is ${customerZone.min_order.toLocaleString('en-IQ')} IQD.` }
    }

    const shopZones = shopZoneIds
      .map(zid => activeZones.find(z => z.id === zid))
      .filter((z): z is NonNullable<typeof z> => !!z)

    deliveryFee = computeDeliveryFee({
      customerZone,
      shopZones,
      subtotal,
      shopCount: shopIds.length,
    })
  }

  // Re-validate the coupon server-side — never trust the discount the client sent.
  let discount = 0
  let appliedCouponId: string | null = null
  if (data.couponCode?.trim()) {
    const shopIds = [...new Set(items.map(i => i.shopId))]
    const result = await applyCoupon(data.couponCode, shopIds, subtotal)
    if ('success' in result && result.success) {
      discount = result.discount
      appliedCouponId = result.couponId
    }
  }

  const total = Math.max(0, subtotal - discount) + deliveryFee

  // Reserve stock before creating the order so two customers can't both buy
  // the last unit. Everything reserved is released if any later step fails.
  const reservation = await reserveStock(admin, items)
  if ('error' in reservation) return { error: reservation.error }
  const reserved = reservation.reserved

  // Written with the service-role client: customers have no direct INSERT
  // rights on orders/items (phase 29), so every order passes this validation.

  const { data: order, error: orderError } = await admin
    .from('bazaar_orders')
    .insert({
      customer_id: user.id,
      status: 'pending',
      delivery_address: data.deliveryAddress.trim(),
      delivery_fee: deliveryFee,
      total,
      note: data.note?.trim() || null,
      address_id: data.addressId ?? null,
      delivery_lat: data.deliveryLat ?? null,
      delivery_lng: data.deliveryLng ?? null,
      zone_id: data.zoneId ?? null,
      scheduled_date: data.scheduledDate ?? null,
      scheduled_slot: data.scheduledSlot ?? null,
      fulfillment_type: isPickup ? 'pickup' : 'delivery',
    })
    .select('id')
    .single()

  if (orderError) {
    await releaseCounters(admin, reserved)
    return { error: orderError.message }
  }

  const orderItems = items.map(item => ({
    order_id: order.id,
    product_id: item.productId,
    shop_id: item.shopId,
    product_name: item.name,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    pickup_status: 'pending' as const,
  }))

  const { error: itemsError } = await admin
    .from('bazaar_order_items')
    .insert(orderItems)

  if (itemsError) {
    // Don't leave an order with no items behind.
    await admin.from('bazaar_orders').delete().eq('id', order.id)
    await releaseCounters(admin, reserved)
    return { error: itemsError.message }
  }

  // Record coupon usage with the service-role client (customers can't UPDATE coupons under RLS).
  if (appliedCouponId) {
    const { data: cpn } = await admin
      .from('bazaar_coupons')
      .select('uses_count')
      .eq('id', appliedCouponId)
      .single()
    if (cpn) {
      await admin
        .from('bazaar_coupons')
        .update({ uses_count: (cpn.uses_count ?? 0) + 1 })
        .eq('id', appliedCouponId)
    }
  }

  revalidatePath('/orders')

  const shopIds = [...new Set(items.map(i => i.shopId))]
  const { data: shops } = await supabase
    .from('bazaar_shops')
    .select('id, owner_id, name')
    .in('id', shopIds)

  if (shops) {
    for (const shop of shops) {
      const count = items.filter(i => i.shopId === shop.id).length
      sendPushToUser(shop.owner_id, {
        type: 'new_order',
        title: 'New order received',
        body: `Order #${order.id.slice(0, 8)} — ${count} item(s) for ${shop.name}`,
        url: '/shop/orders',
      })
    }
  }

  // Pickup orders never involve a driver.
  // NOTE: drivers are notified later, in markShopOrderReady(), once the order
  // is actually in 'ready' status and they can accept it.  Notifying at
  // placement (status: pending) would send drivers to a dashboard that shows
  // nothing, because getAvailableOrders() only returns confirmed/ready orders.

  return { success: true, orderId: order.id }
}

export async function getMyOrders() {
  const user = await getBazaarUser()
  if (!user) return []

  const supabase = await createBazaarServer()

  const { data } = await supabase
    .from('bazaar_orders')
    .select('*, bazaar_order_items(*, bazaar_shops(name, slug))')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return data || []
}

export async function getShopOrders() {
  const user = await getBazaarUser()
  if (!user) return []

  const supabase = await createBazaarServer()

  // Shops are publicly viewable (select using true) so user-scoped client works.
  const { data: shop, error: shopError } = await supabase
    .from('bazaar_shops')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (shopError) console.error('getShopOrders shop error:', shopError)
  if (!shop) return []

  // Use admin for the data queries — even though phase-21 migration adds a
  // shop-owner SELECT policy on bazaar_orders, the admin client guarantees
  // this works even before the migration has been run.
  const admin = createBazaarAdmin()

  // Step 1 — order items for this shop.
  // NOTE: bazaar_order_items did NOT originally have a created_at column.
  //       Phase-21 migration adds it.  We still avoid ordering by it here
  //       because old rows will have the migration timestamp, not the real
  //       order time.  We sort by the parent order's created_at below.
  const { data: items, error: itemsError } = await admin
    .from('bazaar_order_items')
    .select('id, order_id, product_id, shop_id, product_name, quantity, unit_price, pickup_status')
    .eq('shop_id', shop.id)
    .limit(200)

  if (itemsError) {
    console.error('getShopOrders items error:', itemsError)
    return []
  }
  if (!items?.length) return []

  // Step 2 — parent orders with customer profile.
  // bazaar_orders has TWO FKs to bazaar_profiles (customer_id + driver_id).
  // Using the !customer_id hint tells PostgREST which one to follow.
  const orderIds = [...new Set(items.map(i => i.order_id))]

  const { data: orders, error: ordersError } = await admin
    .from('bazaar_orders')
    .select('id, order_number, status, delivery_address, delivery_fee, created_at, scheduled_date, scheduled_slot, fulfillment_type, customer_id, bazaar_profiles!customer_id(full_name, phone)')
    .in('id', orderIds)
    .order('created_at', { ascending: false })

  if (ordersError) console.error('getShopOrders orders error:', ordersError)

  const orderMap = Object.fromEntries((orders ?? []).map(o => [o.id, o]))

  // Return items with their parent order attached — matches the shape
  // the page.tsx reduce and ShopOrderList component expect.
  return items.map(item => ({
    ...item,
    bazaar_orders: orderMap[item.order_id] ?? null,
  }))
}

// Market owner: accept an incoming order. On a multi-shop order the first shop
// to accept flips the whole order 'pending' → 'confirmed' (visible to drivers
// as preparing); subsequent shops are already implicitly in the flow and skip
// the accept step in the UI. Only the first shop's call updates the row.
// Shop owner: accept THIS shop's portion of the order. Only flips this shop's
// items from pending→accepted; the other shops on a multi-shop order stay in
// 'pending' until they accept for themselves.
//
// The order-level status moves to 'confirmed' as soon as the first shop
// accepts (so the customer sees "being prepared"), but that alone no longer
// counts as acceptance for the other shops.
export async function acceptShopOrder(orderId: string) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = createBazaarAdmin()
  const userSupabase = await createBazaarServer()

  const { data: shop } = await userSupabase
    .from('bazaar_shops')
    .select('id')
    .eq('owner_id', user.id)
    .single()
  if (!shop) return { error: 'No shop found' }

  const { data: accepted, error: itemsError } = await supabase
    .from('bazaar_order_items')
    .update({ pickup_status: 'accepted' })
    .eq('order_id', orderId)
    .eq('shop_id', shop.id)
    .eq('pickup_status', 'pending')
    .select('id')
  if (itemsError) return { error: itemsError.message }
  if (!accepted?.length) return { error: 'Nothing to accept on this order for your shop.' }

  // Move the order to 'confirmed' the first time any shop accepts. Guarded
  // by .eq('status','pending') so it's idempotent and safe for the 2nd shop.
  await supabase
    .from('bazaar_orders')
    .update({ status: 'confirmed' })
    .eq('id', orderId)
    .eq('status', 'pending')

  revalidatePath('/shop/orders')
  revalidatePath('/driver')
  revalidatePath('/orders')
  revalidatePath(`/orders/${orderId}`)
  return { success: true }
}

// Market owner: mark this shop's portion of the order ready for driver pickup.
// pickup_status values: 'pending' → 'ready' → 'picked_up'.
// The order's overall status only advances to 'ready' when EVERY shop's items
// are ready — this stops the driver from grabbing a multi-shop order while
// some shops are still packing.
export async function markShopOrderReady(orderId: string) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = createBazaarAdmin()
  const userSupabase = await createBazaarServer()

  const { data: shop } = await userSupabase
    .from('bazaar_shops')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!shop) return { error: 'No shop found' }

  // Mark this shop's items as ready. Accept whichever prior state they were in
  // — 'accepted' is the normal path, but 'pending' also works if the shop
  // skipped the explicit Accept click.
  const { data: readied, error: itemsError } = await supabase
    .from('bazaar_order_items')
    .update({ pickup_status: 'ready' })
    .eq('order_id', orderId)
    .eq('shop_id', shop.id)
    .in('pickup_status', ['pending', 'accepted'])
    .select('id')

  if (itemsError) return { error: itemsError.message }
  if (!readied?.length) return { error: 'Nothing to mark ready on this order for your shop.' }

  // Check whether every item across every shop in this order is ready (or
  // already picked up). Only then does the order become available to drivers.
  const { data: allItems } = await supabase
    .from('bazaar_order_items')
    .select('pickup_status')
    .eq('order_id', orderId)

  const allReady = (allItems || []).every(
    i => i.pickup_status === 'ready' || i.pickup_status === 'picked_up'
  )

  if (allReady) {
    const { error } = await supabase
      .from('bazaar_orders')
      .update({ status: 'ready' })
      .eq('id', orderId)
    if (error) return { error: error.message }

    // Notify online drivers only once, when the whole order is ready.
    sendPushToOnlineDrivers({
      type: 'order_ready',
      title: '📦 Order ready for pickup',
      body: `An order is packed and waiting — tap to accept.`,
      url: '/driver',
    })
  }

  revalidatePath('/shop/orders')
  revalidatePath('/driver')
  return { success: true, allReady }
}

// Legacy alias kept for any remaining callers
export async function confirmShopItems(orderId: string) {
  return markShopOrderReady(orderId)
}

export async function getAvailableOrders() {
  const user = await getBazaarUser()
  if (!user || user.role !== 'driver') return []

  const supabase = createBazaarAdmin()

  // Include 'confirmed' (shop preparing) so driver can see upcoming orders early.
  // 'ready' means shop finished preparing — driver can accept that one.
  const { data, error } = await supabase
    .from('bazaar_orders')
    .select('*, bazaar_order_items(*, bazaar_shops(name, address)), bazaar_profiles!customer_id(full_name, phone)')
    .in('status', ['confirmed', 'ready'])
    .eq('fulfillment_type', 'delivery')
    .is('driver_id', null)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) console.error('getAvailableOrders error:', error)
  return data || []
}

// Shop marks a pickup order as collected by the customer (no driver involved).
export async function markPickupCollected(orderId: string) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = createBazaarAdmin()
  const userSupabase = await createBazaarServer()

  const { data: shop } = await userSupabase
    .from('bazaar_shops')
    .select('id')
    .eq('owner_id', user.id)
    .single()
  if (!shop) return { error: 'No shop found' }

  // Confirm this pickup order contains this shop's items.
  const { data: item } = await supabase
    .from('bazaar_order_items')
    .select('id')
    .eq('order_id', orderId)
    .eq('shop_id', shop.id)
    .limit(1)
    .maybeSingle()
  if (!item) return { error: 'Order not found for your shop.' }

  const { error } = await supabase
    .from('bazaar_orders')
    .update({ status: 'delivered', delivered_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('fulfillment_type', 'pickup')

  if (error) return { error: error.message }
  revalidatePath('/shop/orders')
  return { success: true }
}

export async function getMyDeliveries() {
  const user = await getBazaarUser()
  if (!user || user.role !== 'driver') return []

  const supabase = createBazaarAdmin()

  const { data, error } = await supabase
    .from('bazaar_orders')
    .select('*, bazaar_order_items(*, bazaar_shops(name, address)), bazaar_profiles!customer_id(full_name, phone)')
    .eq('driver_id', user.id)
    .in('status', ['picking_up', 'delivering'])
    .order('created_at', { ascending: false })

  if (error) console.error('getMyDeliveries error:', error)
  return data || []
}

export async function acceptOrder(orderId: string) {
  const user = await getBazaarUser()
  if (!user || user.role !== 'driver') return { error: 'Only drivers can accept orders.' }
  if (!user.is_approved) return { error: 'Your driver account is not yet approved.' }
  if (user.fleet_id) return { error: 'Your delivery company assigns your orders. You cannot accept orders yourself.' }

  const supabase = createBazaarAdmin()

  // First check if the order still exists and is unclaimed — gives a better
  // error message than a silent DB constraint failure.
  const { data: existing } = await supabase
    .from('bazaar_orders')
    .select('id, driver_id, status')
    .eq('id', orderId)
    .maybeSingle()

  if (!existing) return { error: 'Order not found.' }
  if (existing.driver_id !== null) {
    return { error: 'This order was already claimed by another driver.' }
  }
  if (existing.status !== 'ready') {
    return { error: 'This order is not ready for pickup yet — a shop is still preparing.' }
  }

  // Atomic claim — the WHERE driver_id IS NULL ensures only one driver wins
  // even if two tap simultaneously.
  const { data: claimed, error } = await supabase
    .from('bazaar_orders')
    .update({ driver_id: user.id, status: 'picking_up' })
    .eq('id', orderId)
    .is('driver_id', null)
    .eq('status', 'ready')
    .select('id')

  if (error) return { error: error.message }
  if (!claimed?.length) return { error: 'This order was already claimed by another driver.' }

  revalidatePath('/driver')
  return { success: true }
}

// Driver marks that they've collected this shop's items from the shop.
// pickup_status: 'ready' → 'picked_up'. Once all shops on the order are
// picked_up, the driver can advance the order to 'delivering' / 'delivered'.
export async function markShopPickedUp(orderId: string, shopId: string) {
  const user = await getBazaarUser()
  if (!user || user.role !== 'driver') return { error: 'Only drivers can pick up.' }

  const supabase = createBazaarAdmin()

  const { data: order } = await supabase
    .from('bazaar_orders')
    .select('driver_id')
    .eq('id', orderId)
    .maybeSingle()

  if (!order || order.driver_id !== user.id) {
    return { error: 'You are not the driver for this order.' }
  }

  const { error } = await supabase
    .from('bazaar_order_items')
    .update({ pickup_status: 'picked_up' })
    .eq('order_id', orderId)
    .eq('shop_id', shopId)

  if (error) return { error: error.message }

  revalidatePath('/driver')
  return { success: true }
}

const DRIVER_SETTABLE_STATUSES = ['picking_up', 'delivering', 'delivered']

export async function updateOrderStatus(orderId: string, status: string) {
  const user = await getBazaarUser()
  if (!user || user.role !== 'driver') return { error: 'Unauthorized' }
  if (!DRIVER_SETTABLE_STATUSES.includes(status)) return { error: 'Invalid status.' }

  const supabase = createBazaarAdmin()

  const { data: orderData } = await supabase
    .from('bazaar_orders')
    .select('customer_id, order_number, driver_id, status')
    .eq('id', orderId)
    .single()

  if (!orderData || orderData.driver_id !== user.id) {
    return { error: 'You are not the driver for this order.' }
  }
  if (orderData.status === 'delivered' || orderData.status === 'cancelled') {
    return { error: 'This order is already closed.' }
  }

  // Block transition to 'delivering' or 'delivered' until every shop has been
  // marked as picked up. Otherwise a driver could tap "Delivered" while some
  // shops still have items on the shelf.
  if (status === 'delivering' || status === 'delivered') {
    const { data: items } = await supabase
      .from('bazaar_order_items')
      .select('pickup_status')
      .eq('order_id', orderId)
    const allPickedUp = (items || []).every(i => i.pickup_status === 'picked_up')
    if (!allPickedUp) {
      return { error: 'Pick up items from every shop before marking this order as delivered.' }
    }
  }

  const update: Record<string, unknown> = { status }
  if (status === 'delivered') {
    update.delivered_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('bazaar_orders')
    .update(update)
    .eq('id', orderId)
    .eq('driver_id', user.id)

  if (error) return { error: error.message }

  if (orderData) {
    const statusMessages: Record<string, string> = {
      confirmed: 'A driver has accepted your order',
      picking_up: 'Your items are being picked up from the shops',
      delivering: 'Your order is on its way to you',
      delivered: 'Your order has been delivered',
    }
    sendPushToUser(orderData.customer_id, {
      type: 'order_status',
      title: `Order #${orderData.order_number} update`,
      body: statusMessages[status] || `Status changed to ${status}`,
      url: `/orders/${orderId}`,
    })
  }

  revalidatePath('/driver')
  revalidatePath('/orders')
  revalidatePath('/shop/orders')
  return { success: true }
}

// Driver broadcasts their current GPS position to all their active deliveries.
// Called periodically from the driver dashboard while delivering.
export async function updateDriverLocation(lat: number, lng: number) {
  const user = await getBazaarUser()
  if (!user || user.role !== 'driver') return { error: 'Unauthorized' }

  const supabase = createBazaarAdmin()
  const { error } = await supabase
    .from('bazaar_orders')
    .update({
      driver_lat: lat,
      driver_lng: lng,
      driver_location_updated_at: new Date().toISOString(),
    })
    .eq('driver_id', user.id)
    .in('status', ['picking_up', 'delivering'])

  if (error) return { error: error.message }
  return { success: true }
}

export async function cancelOrder(orderId: string) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = createBazaarAdmin()

  const { data: order } = await supabase
    .from('bazaar_orders')
    .select('status, customer_id')
    .eq('id', orderId)
    .single()

  if (!order) return { error: 'Order not found' }
  if (order.customer_id !== user.id) return { error: 'Unauthorized' }
  if (order.status !== 'pending') return { error: 'Order can only be cancelled before the shop accepts it.' }

  const { data: cancelled, error } = await supabase
    .from('bazaar_orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)
    .eq('status', 'pending')
    .select('id')

  if (error) return { error: error.message }
  if (!cancelled?.length) return { error: 'A shop just accepted this order — it can no longer be cancelled.' }
  revalidatePath('/orders')
  return { success: true }
}

// Toggle the calling driver's online/offline status.
// Online drivers receive push notifications for new orders and their panel
// shows available deliveries. Offline drivers see an "You're offline" screen.
export async function setDriverOnline(online: boolean) {
  const user = await getBazaarUser()
  if (!user || user.role !== 'driver') return { error: 'Unauthorized' }
  if (!user.is_approved) return { error: 'Account not yet approved.' }

  const supabase = createBazaarAdmin()
  const { error } = await supabase
    .from('bazaar_profiles')
    .update({ is_online: online })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/driver')
  return { success: true }
}

export async function cancelShopOrder(orderId: string) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = createBazaarAdmin()
  const userSupabase = await createBazaarServer()

  const { data: shop } = await userSupabase
    .from('bazaar_shops')
    .select('id, name')
    .eq('owner_id', user.id)
    .single()

  if (!shop) return { error: 'No shop found' }

  const { data: item } = await supabase
    .from('bazaar_order_items')
    .select('id')
    .eq('order_id', orderId)
    .eq('shop_id', shop.id)
    .limit(1)
    .maybeSingle()

  if (!item) return { error: 'Order not found for your shop' }

  const { data: order } = await supabase
    .from('bazaar_orders')
    .select('id, order_number, status, customer_id, driver_id')
    .eq('id', orderId)
    .single()

  if (!order) return { error: 'Order not found' }
  if (order.status === 'delivered' || order.status === 'cancelled') {
    return { error: 'Order is already delivered or cancelled.' }
  }

  const { error } = await supabase
    .from('bazaar_orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)

  if (error) return { error: error.message }

  const body = `Order cancelled by ${shop.name}.`
  sendPushToUser(order.customer_id, {
    type: 'order_status',
    title: `Order #${order.order_number} cancelled`,
    body,
    url: `/orders/${orderId}`,
  })
  if (order.driver_id) {
    sendPushToUser(order.driver_id, {
      type: 'order_status',
      title: `Order #${order.order_number} cancelled`,
      body,
      url: `/driver`,
    })
  }

  revalidatePath('/shop/orders')
  revalidatePath('/driver')
  revalidatePath('/orders')
  revalidatePath(`/orders/${orderId}`)
  return { success: true }
}

