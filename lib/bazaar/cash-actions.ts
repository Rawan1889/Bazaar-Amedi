'use server'

import { revalidatePath } from 'next/cache'
import { createBazaarAdmin } from './supabase-server'
import { getBazaarUser } from './auth'

// Driver: total COD cash collected (delivered orders) that hasn't been remitted
// to the office yet, plus the count of orders making it up.
export async function getMyCashToRemit(): Promise<{ amount: number; orders: number }> {
  const user = await getBazaarUser()
  if (!user || user.role !== 'driver') return { amount: 0, orders: 0 }

  const admin = createBazaarAdmin()
  const { data } = await admin
    .from('bazaar_orders')
    .select('total')
    .eq('driver_id', user.id)
    .eq('status', 'delivered')
    .eq('cash_remitted', false)

  const rows = (data as { total: number }[]) || []
  return { amount: rows.reduce((s, r) => s + (r.total || 0), 0), orders: rows.length }
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
