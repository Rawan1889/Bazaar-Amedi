'use server'

import { revalidatePath } from 'next/cache'
import { createBazaarServer } from './supabase-server'
import { getBazaarUser } from './auth'

export interface Address {
  id: string
  label: string
  address_text: string
  neighborhood: string | null
  lat: number | null
  lng: number | null
  is_default: boolean
  zone_id: string | null
}

export async function getAddresses(): Promise<Address[]> {
  const user = await getBazaarUser()
  if (!user) return []

  const supabase = await createBazaarServer()
  const { data } = await supabase
    .from('bazaar_addresses')
    .select('id, label, address_text, neighborhood, lat, lng, is_default, zone_id')
    .eq('customer_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  return (data as Address[]) || []
}

export async function addAddress(data: {
  label: string
  addressText: string
  neighborhood?: string | null
  lat: number | null
  lng: number | null
  zoneId?: string | null
  makeDefault?: boolean
}) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Please sign in.' }
  if (!data.addressText.trim()) return { error: 'Address description is required.' }

  const supabase = await createBazaarServer()

  // Is this the customer's first address? If so, force it to be the default.
  const { count } = await supabase
    .from('bazaar_addresses')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', user.id)

  const makeDefault = data.makeDefault || (count ?? 0) === 0

  if (makeDefault) {
    await supabase
      .from('bazaar_addresses')
      .update({ is_default: false })
      .eq('customer_id', user.id)
  }

  const { data: inserted, error } = await supabase
    .from('bazaar_addresses')
    .insert({
      customer_id: user.id,
      label: data.label.trim() || 'Home',
      address_text: data.addressText.trim(),
      neighborhood: data.neighborhood?.trim() || null,
      lat: data.lat,
      lng: data.lng,
      zone_id: data.zoneId ?? null,
      is_default: makeDefault,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/profile')
  revalidatePath('/cart')
  return { success: true, id: inserted.id }
}

export async function deleteAddress(addressId: string) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Please sign in.' }

  const supabase = await createBazaarServer()
  const { error } = await supabase
    .from('bazaar_addresses')
    .delete()
    .eq('id', addressId)
    .eq('customer_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/profile')
  revalidatePath('/cart')
  return { success: true }
}

export async function setDefaultAddress(addressId: string) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Please sign in.' }

  const supabase = await createBazaarServer()
  await supabase
    .from('bazaar_addresses')
    .update({ is_default: false })
    .eq('customer_id', user.id)

  const { error } = await supabase
    .from('bazaar_addresses')
    .update({ is_default: true })
    .eq('id', addressId)
    .eq('customer_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/profile')
  revalidatePath('/cart')
  return { success: true }
}
