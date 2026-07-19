'use server'

import { revalidatePath } from 'next/cache'
import { createBazaarServer, createBazaarAdmin } from './supabase-server'
import { getBazaarUser } from './auth'
import type { DeliveryZone } from './zone-utils'

export type { DeliveryZone }

// Fetch active delivery zones for a set of shops. Used by the cart to preview
// the multi-shop delivery fee (farthest zone) before checkout.
export async function getShopZones(shopIds: string[]): Promise<Pick<DeliveryZone, 'fee'>[]> {
  if (shopIds.length === 0) return []
  const supabase = await createBazaarServer()
  const { data: shops } = await supabase
    .from('bazaar_shops')
    .select('zone_id')
    .in('id', shopIds)
  const zoneIds = (shops || []).map(s => s.zone_id).filter((id): id is string => !!id)
  if (zoneIds.length === 0) return []
  const { data: zones } = await supabase
    .from('bazaar_delivery_zones')
    .select('fee, is_active')
    .in('id', zoneIds)
  return (zones || []).filter(z => z.is_active).map(z => ({ fee: z.fee }))
}

// Public: active zones for the checkout / address picker.
export async function getActiveZones(): Promise<DeliveryZone[]> {
  const supabase = await createBazaarServer()
  const { data } = await supabase
    .from('bazaar_delivery_zones')
    .select('id, name, fee, min_order, free_delivery_threshold, is_active, sort_order')
    .eq('is_active', true)
    .order('sort_order')
  return (data as DeliveryZone[]) || []
}

// Admin: every zone (active or not).
export async function getAllZones(): Promise<DeliveryZone[]> {
  const user = await getBazaarUser()
  if (!user || user.role !== 'super_admin') return []
  const supabase = await createBazaarServer()
  const { data } = await supabase
    .from('bazaar_delivery_zones')
    .select('id, name, fee, min_order, free_delivery_threshold, is_active, sort_order')
    .order('sort_order')
  return (data as DeliveryZone[]) || []
}

async function requireAdmin() {
  const user = await getBazaarUser()
  if (!user || user.role !== 'super_admin') return null
  return user
}

export async function createZone(formData: FormData) {
  if (!(await requireAdmin())) return { error: 'Unauthorized' }
  const name = (formData.get('name') as string)?.trim()
  const fee = parseInt(formData.get('fee') as string, 10)
  const minOrder = parseInt((formData.get('min_order') as string) || '0', 10)
  const thresholdRaw = (formData.get('free_delivery_threshold') as string)?.trim()
  const threshold = thresholdRaw ? parseInt(thresholdRaw, 10) : null

  if (!name || isNaN(fee)) return { error: 'Name and fee are required.' }

  const admin = createBazaarAdmin()
  const { error } = await admin.from('bazaar_delivery_zones').insert({
    name, fee, min_order: isNaN(minOrder) ? 0 : minOrder, free_delivery_threshold: threshold,
  })
  if (error) return { error: error.message }
  revalidatePath('/admin/zones')
  return { success: true }
}

export async function updateZone(id: string, formData: FormData) {
  if (!(await requireAdmin())) return { error: 'Unauthorized' }
  const name = (formData.get('name') as string)?.trim()
  const fee = parseInt(formData.get('fee') as string, 10)
  const minOrder = parseInt((formData.get('min_order') as string) || '0', 10)
  const thresholdRaw = (formData.get('free_delivery_threshold') as string)?.trim()
  const threshold = thresholdRaw ? parseInt(thresholdRaw, 10) : null

  if (!name || isNaN(fee)) return { error: 'Name and fee are required.' }

  const admin = createBazaarAdmin()
  const { error } = await admin.from('bazaar_delivery_zones').update({
    name, fee, min_order: isNaN(minOrder) ? 0 : minOrder, free_delivery_threshold: threshold,
  }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/zones')
  return { success: true }
}

export async function toggleZone(id: string, isActive: boolean) {
  if (!(await requireAdmin())) return { error: 'Unauthorized' }
  const admin = createBazaarAdmin()
  const { error } = await admin.from('bazaar_delivery_zones').update({ is_active: isActive }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/zones')
  return { success: true }
}

export async function deleteZone(id: string) {
  if (!(await requireAdmin())) return { error: 'Unauthorized' }
  const admin = createBazaarAdmin()
  const { error } = await admin.from('bazaar_delivery_zones').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/zones')
  return { success: true }
}
