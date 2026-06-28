'use server'

import { revalidatePath } from 'next/cache'
import { createBazaarAdmin } from './supabase-server'
import { getBazaarUser } from './auth'

export interface ShopRemittance {
  name: string
  amount: number
}

export interface CashSummary {
  amount: number
  orders: number
  deliveryFees: number
  discounts: number
  shops: ShopRemittance[]
}

// Driver: total COD cash collected (delivered orders) that hasn't been remitted
// to the office yet, plus the count of orders making it up and shop-by-shop breakdown.
export async function getMyCashToRemit(): Promise<CashSummary> {
  const user = await getBazaarUser()
  if (!user || user.role !== 'driver') {
    return { amount: 0, orders: 0, deliveryFees: 0, discounts: 0, shops: [] }
  }

  const admin = createBazaarAdmin()
  const { data: ordersData, error: ordersError } = await admin
    .from('bazaar_orders')
    .select('id, total, delivery_fee')
    .eq('driver_id', user.id)
    .eq('status', 'delivered')
    .eq('cash_remitted', false)

  if (ordersError || !ordersData?.length) {
    return { amount: 0, orders: 0, deliveryFees: 0, discounts: 0, shops: [] }
  }

  const orderIds = ordersData.map(o => o.id)

  const { data: itemsData, error: itemsError } = await admin
    .from('bazaar_order_items')
    .select('order_id, unit_price, quantity, bazaar_shops(name)')
    .in('order_id', orderIds)

  if (itemsError || !itemsData?.length) {
    // Fallback: if items couldn't be loaded, return totals only
    const amount = ordersData.reduce((s, o) => s + (o.total || 0), 0)
    const deliveryFees = ordersData.reduce((s, o) => s + (o.delivery_fee || 0), 0)
    return { amount, orders: ordersData.length, deliveryFees, discounts: 0, shops: [] }
  }

  let totalAmount = 0
  let totalDeliveryFees = 0
  let totalDiscounts = 0
  const shopMap = new Map<string, number>()

  for (const o of ordersData) {
    totalAmount += o.total || 0
    totalDeliveryFees += o.delivery_fee || 0

    const orderItems = itemsData.filter(i => i.order_id === o.id)
    const subtotal = orderItems.reduce((s, i) => s + (i.unit_price * i.quantity), 0)
    
    // Total = subtotal + delivery_fee - discount
    // Therefore: discount = subtotal + delivery_fee - total
    const orderDiscount = Math.max(0, (subtotal + o.delivery_fee) - o.total)
    totalDiscounts += orderDiscount

    for (const item of orderItems) {
      const shops = item.bazaar_shops as any
      const shopName = (Array.isArray(shops) ? shops[0]?.name : shops?.name) || 'Unknown Shop'
      const itemTotal = item.unit_price * item.quantity
      shopMap.set(shopName, (shopMap.get(shopName) || 0) + itemTotal)
    }
  }

  const shops = Array.from(shopMap.entries()).map(([name, amount]) => ({
    name,
    amount,
  })).sort((a, b) => b.amount - a.amount)

  return {
    amount: totalAmount,
    orders: ordersData.length,
    deliveryFees: totalDeliveryFees,
    discounts: totalDiscounts,
    shops,
  }
}

export interface DriverCash {
  driver_id: string
  full_name: string
  phone: string
  amount: number
  orders: number
}

// Admin: outstanding cash per driver (delivered, not yet remitted).
export async function getDriversCashSummary(): Promise<DriverCash[]> {
  const user = await getBazaarUser()
  if (!user || user.role !== 'super_admin') return []

  const admin = createBazaarAdmin()
  const { data } = await admin
    .from('bazaar_orders')
    .select('total, driver_id, bazaar_profiles!bazaar_orders_driver_id_fkey(full_name, phone)')
    .eq('status', 'delivered')
    .eq('cash_remitted', false)
    .not('driver_id', 'is', null)

  const rows = (data as unknown as {
    total: number; driver_id: string; bazaar_profiles: { full_name: string; phone: string } | null
  }[]) || []

  const map = new Map<string, DriverCash>()
  for (const r of rows) {
    const cur = map.get(r.driver_id) || {
      driver_id: r.driver_id,
      full_name: r.bazaar_profiles?.full_name || 'Driver',
      phone: r.bazaar_profiles?.phone || '',
      amount: 0, orders: 0,
    }
    cur.amount += r.total || 0
    cur.orders += 1
    map.set(r.driver_id, cur)
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount)
}

// Admin: mark all of a driver's outstanding cash as remitted (settled).
export async function settleDriverCash(driverId: string) {
  const user = await getBazaarUser()
  if (!user || user.role !== 'super_admin') return { error: 'Unauthorized' }

  const admin = createBazaarAdmin()
  const { error } = await admin
    .from('bazaar_orders')
    .update({ cash_remitted: true })
    .eq('driver_id', driverId)
    .eq('status', 'delivered')
    .eq('cash_remitted', false)

  if (error) return { error: error.message }
  revalidatePath('/admin/cash')
  return { success: true }
}
