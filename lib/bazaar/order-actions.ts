'use server'

import { revalidatePath } from 'next/cache'
import { createBazaarServer, createBazaarAdmin } from './supabase-server'
import { getBazaarUser } from './auth'
import { sendPushToUser, sendPushToOnlineDrivers } from './push-notifications'
import { applyCoupon } from './coupon-actions'
import { feeForZone } from './zone-utils'

interface CartItemInput {
  productId: string
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

  const isPickup = data.fulfillmentType === 'pickup'

  if (!data.items.length) return { error: 'Cart is empty.' }
  if (isPickup) {
    const shopIds = new Set(data.items.map(i => i.shopId))
    if (shopIds.size > 1) return { error: 'Pickup is only available for single-shop orders.' }
  } else if (!data.deliveryAddress.trim()) {
    return { error: 'Delivery address is required.' }
  }

  const supabase = await createBazaarServer()

  const subtotal = data.items.reduce(
    (sum, i) => sum + (i.salePrice ?? i.price) * i.quantity, 0
  )

  // Resolve the delivery fee server-side from the chosen zone — never trust a
  // fee from the client. Enforce the zone's minimum order value too.
  // Pickup orders have no delivery fee.
  let deliveryFee = isPickup ? 0 : 2500
  if (!isPickup && data.zoneId) {
    const { data: zone } = await supabase
      .from('bazaar_delivery_zones')
      .select('fee, min_order, free_delivery_threshold, is_active')
      .eq('id', data.zoneId)
      .maybeSingle()
    if (zone && zone.is_active) {
      if (zone.min_order && subtotal < zone.min_order) {
        return { error: `Minimum order for this area is ${zone.min_order.toLocaleString('en-IQ')} IQD.` }
      }
      deliveryFee = feeForZone(zone, subtotal)
    }
  }

  // Re-validate the coupon server-side — never trust the discount the client sent.
  let discount = 0
  let appliedCouponId: string | null = null
  if (data.couponCode?.trim()) {
    const shopIds = [...new Set(data.items.map(i => i.shopId))]
    const result = await applyCoupon(data.couponCode, shopIds, subtotal)
    if ('success' in result && result.success) {
      discount = result.discount
      appliedCouponId = result.couponId
    }
  }

  const total = Math.max(0, subtotal - discount) + deliveryFee

  const { data: order, error: orderError } = await supabase
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
      delivery_code: String(Math.floor(1000 + Math.random() * 9000)),
      fulfillment_type: isPickup ? 'pickup' : 'delivery',
    })
    .select('id')
    .single()

  if (orderError) return { error: orderError.message }

  const orderItems = data.items.map(item => ({
    order_id: order.id,
    product_id: item.productId,
    shop_id: item.shopId,
    product_name: item.name,
    quantity: item.quantity,
    unit_price: item.salePrice ?? item.price,
    pickup_status: 'pending' as const,
  }))

  const { error: itemsError } = await supabase
    .from('bazaar_order_items')
    .insert(orderItems)

  if (itemsError) return { error: itemsError.message }

  // Decrement stock_qty on product variants for each ordered item.
  // Match variant by product_id + price so we don't need variant_id on cart items.
  const admin = createBazaarAdmin()
  for (const item of data.items) {
    const effectivePrice = item.salePrice ?? item.price
    const { data: variant } = await admin
      .from('bazaar_product_variants')
      .select('id, stock_qty')
      .eq('product_id', item.productId)
      .eq('price', effectivePrice)
      .not('stock_qty', 'is', null)
      .limit(1)
      .maybeSingle()
    if (variant && variant.stock_qty !== null) {
      const newQty = Math.max(0, variant.stock_qty - item.quantity)
      await admin
        .from('bazaar_product_variants')
        .update({ stock_qty: newQty, in_stock: newQty > 0 })
        .eq('id', variant.id)
    }
  }

  // Decrement flash sale quantities for items purchased at a sale price.
  for (const item of data.items) {
    if (item.salePrice === null) continue
    const { data: sale } = await admin
      .from('bazaar_flash_sales')
      .select('id, quantity')
      .eq('product_id', item.productId)
      .eq('sale_price', item.salePrice)
      .eq('is_active', true)
      .not('quantity', 'is', null)
      .limit(1)
      .maybeSingle()
    if (sale && sale.quantity !== null) {
      const newQty = Math.max(0, sale.quantity - item.quantity)
      await admin
        .from('bazaar_flash_sales')
        .update({ quantity: newQty, is_active: newQty > 0 })
        .eq('id', sale.id)
    }
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

  const shopIds = [...new Set(data.items.map(i => i.shopId))]
  const { data: shops } = await supabase
    .from('bazaar_shops')
    .select('owner_id, name')
    .in('id', shopIds)

  if (shops) {
    for (const shop of shops) {
      sendPushToUser(shop.owner_id, {
        type: 'new_order',
        title: 'New order received',
        body: `Order #${order.id.slice(0, 8)} — ${data.items.length} item(s) for ${shop.name}`,
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

  // Verify shop ownership using user-scoped client.
  const userSupabase = await createBazaarServer()
  const { data: shop, error: shopError } = await userSupabase
    .from('bazaar_shops')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (shopError) console.error('getShopOrders shop error:', shopError)
  if (!shop) return []

  const admin = createBazaarAdmin()

  // Step 1: get order items for this shop (admin — bypasses RLS).
  const { data: items, error: itemsError } = await admin
    .from('bazaar_order_items')
    .select('id, order_id, product_id, shop_id, product_name, quantity, unit_price, pickup_status, created_at')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (itemsError) {
    console.error('getShopOrders items error:', itemsError)
    return []
  }
  if (!items?.length) return []

  // Step 2: fetch the parent orders for those item rows.
  // We avoid a nested join here because bazaar_orders has TWO foreign keys to
  // bazaar_profiles (customer_id and driver_id) — PostgREST can't resolve the
  // ambiguity when you embed bazaar_profiles inside the join and silently
  // returns null for the entire bazaar_orders object.
  const orderIds = [...new Set(items.map(i => i.order_id))]

  const { data: orders, error: ordersError } = await admin
    .from('bazaar_orders')
    .select('id, order_number, status, delivery_address, delivery_fee, created_at, scheduled_date, scheduled_slot, fulfillment_type, customer_id, bazaar_profiles!customer_id(full_name, phone)')
    .in('id', orderIds)

  if (ordersError) console.error('getShopOrders orders error:', ordersError)

  const orderMap = Object.fromEntries((orders ?? []).map(o => [o.id, o]))

  // Return items in the shape the page expects: item.bazaar_orders = order object.
  return items.map(item => ({
    ...item,
    bazaar_orders: orderMap[item.order_id] ?? null,
  }))
}

// Market owner: accept an incoming order
export async function acceptShopOrder(orderId: string) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = createBazaarAdmin()
  const { error } = await supabase
    .from('bazaar_orders')
    .update({ status: 'confirmed' })
    .eq('id', orderId)

  if (error) return { error: error.message }
  revalidatePath('/shop/orders')
  revalidatePath('/driver')
  return { success: true }
}

// Market owner: mark order ready for driver pickup
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

  // Mark this shop's items as ready
  await supabase
    .from('bazaar_order_items')
    .update({ pickup_status: 'ready' })
    .eq('order_id', orderId)
    .eq('shop_id', shop.id)

  // Mark order as ready for driver
  const { error } = await supabase
    .from('bazaar_orders')
    .update({ status: 'ready' })
    .eq('id', orderId)

  if (error) return { error: error.message }
  revalidatePath('/shop/orders')
  revalidatePath('/driver')

  // Notify online drivers that an order is now ready for pickup.
  sendPushToOnlineDrivers({
    type: 'order_ready',
    title: '📦 Order ready for pickup',
    body: `An order is packed and waiting — tap to accept.`,
    url: '/driver',
  })

  return { success: true }
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
    .select('*, bazaar_order_items(*, bazaar_shops(name, address)), bazaar_profiles(full_name, phone)')
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
    .select('*, bazaar_order_items(*, bazaar_shops(name, address)), bazaar_profiles(full_name, phone)')
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
  if (!['confirmed', 'ready'].includes(existing.status)) {
    return { error: 'This order is no longer available.' }
  }

  // Atomic claim — the WHERE driver_id IS NULL ensures only one driver wins
  // even if two tap simultaneously.
  const { error } = await supabase
    .from('bazaar_orders')
    .update({ driver_id: user.id, status: 'picking_up' })
    .eq('id', orderId)
    .is('driver_id', null)

  if (error) return { error: error.message }

  revalidatePath('/driver')
  return { success: true }
}

export async function updateOrderStatus(orderId: string, status: string, deliveryCode?: string) {
  const user = await getBazaarUser()
  if (!user || user.role !== 'driver') return { error: 'Unauthorized' }

  const supabase = createBazaarAdmin()

  const { data: orderData } = await supabase
    .from('bazaar_orders')
    .select('customer_id, order_number, delivery_code')
    .eq('id', orderId)
    .single()

  const update: Record<string, unknown> = { status }
  if (status === 'delivered') {
    // Require the customer's handoff code to confirm delivery (proof of delivery).
    if (orderData?.delivery_code && deliveryCode?.trim() !== orderData.delivery_code) {
      return { error: 'Incorrect delivery code. Ask the customer for their 4-digit code.' }
    }
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

  const { error } = await supabase
    .from('bazaar_orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)

  if (error) return { error: error.message }
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
