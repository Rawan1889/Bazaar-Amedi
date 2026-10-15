'use server'

import { createBazaarAdmin } from './supabase-server'
import { getBazaarUser } from './auth'
import { monthRange, summarizeDeliveryCut, type DeliveredOrder, type DeliveryCutReport } from './delivery-cut'

export type DeliveryPeriod = 'this-month' | 'last-month' | 'all'

const PAGE = 1000

// Delivered orders per driver and per delivery company, with Kela's 15% of
// the delivery fees. Pickup orders have no driver and are left out.
export async function getDeliveryCutReport(period: DeliveryPeriod): Promise<DeliveryCutReport | null> {
  const user = await getBazaarUser()
  if (!user || user.role !== 'super_admin') return null

  const admin = createBazaarAdmin()
  const range = period === 'all' ? null : monthRange(Date.now(), period === 'last-month' ? 1 : 0)

  type Row = {
    delivery_fee: number | null
    driver_id: string
    fleet_id: string | null
    driver: { full_name: string | null; phone: string | null } | null
    bazaar_fleets: { name: string | null } | null
  }

  const rows: Row[] = []
  for (let from = 0; ; from += PAGE) {
    let q = admin
      .from('bazaar_orders')
      .select('delivery_fee, driver_id, fleet_id, driver:bazaar_profiles!driver_id(full_name, phone), bazaar_fleets(name)')
      .eq('status', 'delivered')
      .eq('fulfillment_type', 'delivery')
      .not('driver_id', 'is', null)
    if (range) q = q.gte('delivered_at', range.from).lt('delivered_at', range.to)
    const { data, error } = await q.order('delivered_at', { ascending: true }).order('id').range(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    rows.push(...((data || []) as unknown as Row[]))
    if (!data || data.length < PAGE) break
  }

  const orders: DeliveredOrder[] = rows.map(r => ({
    delivery_fee: r.delivery_fee,
    driver_id: r.driver_id,
    driver_name: r.driver?.full_name || 'Driver',
    driver_phone: r.driver?.phone ?? null,
    fleet_id: r.fleet_id,
    fleet_name: r.bazaar_fleets?.name ?? null,
  }))

  return summarizeDeliveryCut(orders)
}
