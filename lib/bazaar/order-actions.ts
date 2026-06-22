'use server'

import { revalidatePath } from 'next/cache'
import { createBazaarServer, createBazaarAdmin } from './supabase-server'
import { getBazaarUser } from './auth'
import { sendPushToUser, sendPushToRole } from './push-notifications'
import { applyCoupon } from './coupon-actions'

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
}) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Please sign in to place an order.' }
  if (user.role !== 'customer' && user.role !== 'super_admin') {
    return { error: 'Only customers can place orders.' }
  }

  if (!data.items.length) return { error: 'Cart is empty.' }
  if (!data.deliveryAddress.trim()) return { error: 'Delivery address is required.' }

  const supabase = await createBazaarServer()

  const subtotal = data.items.reduce(
    (sum, i) => sum + (i.salePrice ?? i.price) * i.quantity, 0
  )
  const deliveryFee = 2500

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
      .single()
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
      .single()
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

  sendPushToRole('driver', {
    type: 'new_order',
    title: 'New delivery available',
    body: `${data.items.length} item(s) to ${data.deliveryAddress}`,
    url: '/driver',
  })

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

  const { data: shop } = await supabase
    .from('bazaar_shops')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!shop) return []

  const { data } = await supabase
    .from('bazaar_order_items')
    .select('*, bazaar_orders(*, bazaar_profiles!bazaar_orders_customer_id_fkey(full_name, phone))')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false })

  return data || []
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

  const { data } = await supabase
    .from('bazaar_orders')
    .select('*, bazaar_order_items(*, bazaar_shops(name, address)), bazaar_profiles!bazaar_orders_customer_id_fkey(full_name, phone)')
    .eq('status', 'ready')
    .is('driver_id', null)
    .order('created_at', { ascending: false })
    .limit(20)

  return data || []
}

export async function getMyDeliveries() {
  const user = await getBazaarUser()
  if (!user || user.role !== 'driver') return []

  const supabase = createBazaarAdmin()

  const { data } = await supabase
    .from('bazaar_orders')
    .select('*, bazaar_order_items(*, bazaar_shops(name, address)), bazaar_profiles!bazaar_orders_customer_id_fkey(full_name, phone)')
    .eq('driver_id', user.id)
    .in('status', ['picking_up', 'delivering'])
    .order('created_at', { ascending: false })

  return data || []
}

export async function acceptOrder(orderId: string) {
  const user = await getBazaarUser()
  if (!user || user.role !== 'driver') return { error: 'Only drivers can accept orders.' }

  const supabase = createBazaarAdmin()

  const { error } = await supabase
    .from('bazaar_orders')
    .update({ driver_id: user.id, status: 'picking_up' })
    .eq('id', orderId)
    .is('driver_id', null)

  if (error) return { error: error.message }

  revalidatePath('/driver')
  return { success: true }
}

export async function updateOrderStatus(orderId: string, status: string) {
  const user = await getBazaarUser()
  if (!user || user.role !== 'driver') return { error: 'Unauthorized' }

  const supabase = createBazaarAdmin()

  const update: Record<string, unknown> = { status }
  if (status === 'delivered') {
    update.delivered_at = new Date().toISOString()
  }

  const { data: orderData } = await supabase
    .from('bazaar_orders')
    .select('customer_id, order_number')
    .eq('id', orderId)
    .single()

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
