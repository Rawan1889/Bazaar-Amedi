'use server'

import { revalidatePath } from 'next/cache'
import { createBazaarServer } from './supabase-server'
import { getBazaarUser } from './auth'

export async function toggleFollow(shopId: string) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Please sign in to follow shops.' }

  const supabase = await createBazaarServer()

  const { data: existing } = await supabase
    .from('bazaar_followers')
    .select('id')
    .eq('customer_id', user.id)
    .eq('shop_id', shopId)
    .single()

  if (existing) {
    await supabase
      .from('bazaar_followers')
      .delete()
      .eq('id', existing.id)
  } else {
    await supabase
      .from('bazaar_followers')
      .insert({ customer_id: user.id, shop_id: shopId })
  }

  revalidatePath('/s/')
  return { success: true, following: !existing }
}

export async function getFollowedShops() {
  const user = await getBazaarUser()
  if (!user) return []

  const supabase = await createBazaarServer()

  const { data } = await supabase
    .from('bazaar_followers')
    .select('shop_id, bazaar_shops(id, name, slug, logo_url, is_open, bazaar_categories(name_en))')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  return data || []
}

export async function isFollowing(shopId: string) {
  const user = await getBazaarUser()
  if (!user) return false

  const supabase = await createBazaarServer()

  const { data } = await supabase
    .from('bazaar_followers')
    .select('id')
    .eq('customer_id', user.id)
    .eq('shop_id', shopId)
    .single()

  return !!data
}

export async function getFollowerCount(shopId: string) {
  const supabase = await createBazaarServer()

  const { count } = await supabase
    .from('bazaar_followers')
    .select('*', { count: 'exact', head: true })
    .eq('shop_id', shopId)

  return count || 0
}
