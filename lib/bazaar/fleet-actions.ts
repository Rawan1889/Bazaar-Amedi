'use server'

import { revalidatePath } from 'next/cache'
import { getBazaarUser } from './auth'
import { createBazaarAdmin } from './supabase-server'
import { sendPushToUser } from './push-notifications'

// Approved delivery companies, for the driver signup picker. Names only.
export async function getApprovedFleets(): Promise<{ id: string; name: string }[]> {
  const supabase = createBazaarAdmin()
  const { data } = await supabase
    .from('bazaar_fleets')
    .select('id, name, bazaar_profiles!owner_id(is_approved, is_suspended)')
    .order('name')
  return (data ?? [])
    .filter(f => {
      const p = f.bazaar_profiles as unknown as { is_approved: boolean; is_suspended: boolean } | null
      return p?.is_approved && !p.is_suspended
    })
    .map(f => ({ id: f.id, name: f.name }))
}

async function requireFleetManager() {
  const user = await getBazaarUser()
  if (!user || user.role !== 'fleet_manager' || !user.is_approved || user.is_suspended) return null
  const supabase = createBazaarAdmin()
  const { data: fleet } = await supabase
    .from('bazaar_fleets')
    .select('id, name')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!fleet) return null
  return { user, fleet, supabase }
}

export async function getFleetDashboard() {
  const ctx = await requireFleetManager()
  if (!ctx) return null
  const { fleet, supabase } = ctx

  const [{ data: drivers }, { data: available }, { data: active }] = await Promise.all([
    supabase
      .from('bazaar_profiles')
      .select('id, full_name, phone, is_online, is_approved, is_suspended')
      .eq('fleet_id', fleet.id)
      .eq('role', 'driver')
      .order('full_name'),
    supabase
      .from('bazaar_orders')
      .select('id, order_number, status, total, delivery_address, created_at, bazaar_order_items(bazaar_shops(name))')
      .in('status', ['confirmed', 'ready'])
      .eq('fulfillment_type', 'delivery')
      .is('driver_id', null)
      .order('created_at', { ascending: true })
      .limit(30),
    supabase
      .from('bazaar_orders')
      .select('id, order_number, status, total, delivery_address, driver_id, created_at')
      .eq('fleet_id', fleet.id)
      .in('status', ['picking_up', 'delivering'])
      .order('created_at', { ascending: true }),
  ])

  return { fleet, drivers: drivers ?? [], available: available ?? [], active: active ?? [] }
}

// Fleet manager takes a ready order and gives it to one of their drivers.
export async function assignOrderToDriver(orderId: string, driverId: string) {
  const ctx = await requireFleetManager()
  if (!ctx) return { error: 'Only an approved delivery company can assign orders.' }
  const { fleet, supabase } = ctx

  const { data: driver } = await supabase
    .from('bazaar_profiles')
    .select('id, role, fleet_id, is_approved, is_suspended')
    .eq('id', driverId)
    .maybeSingle()
  if (!driver || driver.role !== 'driver' || driver.fleet_id !== fleet.id) {
    return { error: 'This driver is not in your company.' }
  }
  if (!driver.is_approved || driver.is_suspended) {
    return { error: 'This driver is not approved yet.' }
  }

  // Same atomic claim as acceptOrder: only one driver or company can win.
  const { data: claimed, error } = await supabase
    .from('bazaar_orders')
    .update({ driver_id: driverId, fleet_id: fleet.id, status: 'picking_up' })
    .eq('id', orderId)
    .is('driver_id', null)
    .eq('status', 'ready')
    .select('id, order_number')

  if (error) return { error: error.message }
  if (!claimed?.length) return { error: 'This order is no longer available, or a shop is still preparing it.' }

  sendPushToUser(driverId, {
    type: 'order_assigned',
    title: 'New delivery assigned',
    body: `${fleet.name} assigned you order #${claimed[0].order_number}.`,
    url: '/driver',
  })

  revalidatePath('/fleet')
  revalidatePath('/driver')
  revalidatePath('/orders')
  revalidatePath(`/orders/${orderId}`)
  revalidatePath('/shop/orders')
  return { success: true }
}

// Fleet manager approves a driver who signed up under their company.
export async function approveFleetDriver(driverId: string) {
  const ctx = await requireFleetManager()
  if (!ctx) return { error: 'Unauthorized' }
  const { fleet, supabase } = ctx

  const { data, error } = await supabase
    .from('bazaar_profiles')
    .update({ is_approved: true })
    .eq('id', driverId)
    .eq('fleet_id', fleet.id)
    .eq('role', 'driver')
    .select('id')
  if (error) return { error: error.message }
  if (!data?.length) return { error: 'This driver is not in your company.' }

  sendPushToUser(driverId, {
    type: 'account_approved',
    title: 'Your account is approved!',
    body: `${fleet.name} approved you. Go online to receive deliveries.`,
    url: '/driver',
  })
  revalidatePath('/fleet')
  return { success: true }
}

// Remove a driver from the company. They become an unapproved independent
// driver, so the Kela team reviews them again before they can take orders.
export async function removeFleetDriver(driverId: string) {
  const ctx = await requireFleetManager()
  if (!ctx) return { error: 'Unauthorized' }
  const { fleet, supabase } = ctx

  const { error } = await supabase
    .from('bazaar_profiles')
    .update({ fleet_id: null, is_approved: false })
    .eq('id', driverId)
    .eq('fleet_id', fleet.id)
  if (error) return { error: error.message }
  revalidatePath('/fleet')
  return { success: true }
}
