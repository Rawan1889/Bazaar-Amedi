'use server'

import { revalidatePath } from 'next/cache'
import { createBazaarServer, createBazaarAdmin } from './supabase-server'
import { getBazaarUser } from './auth'

export interface PromoBanner {
  id: string
  title: string
  message: string | null
  link_url: string | null
  link_label: string | null
  starts_at: string
  ends_at: string
  is_active: boolean
}

// Public: the single currently-live banner (active + within its date window).
export async function getActiveBanner(): Promise<PromoBanner | null> {
  const supabase = await createBazaarServer()
  const now = new Date().toISOString()
  const { data } = await supabase
    .from('bazaar_promo_banners')
    .select('id, title, message, link_url, link_label, starts_at, ends_at, is_active')
    .eq('is_active', true)
    .lte('starts_at', now)
    .gte('ends_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return (data as PromoBanner) || null
}

export async function getAllBanners(): Promise<PromoBanner[]> {
  const user = await getBazaarUser()
  if (!user || user.role !== 'super_admin') return []
  const supabase = await createBazaarServer()
  const { data } = await supabase
    .from('bazaar_promo_banners')
    .select('id, title, message, link_url, link_label, starts_at, ends_at, is_active')
    .order('created_at', { ascending: false })
  return (data as PromoBanner[]) || []
}

async function requireAdmin() {
  const user = await getBazaarUser()
  return user && user.role === 'super_admin' ? user : null
}

export async function createBanner(formData: FormData) {
  if (!(await requireAdmin())) return { error: 'Unauthorized' }
  const title = (formData.get('title') as string)?.trim()
  const message = (formData.get('message') as string)?.trim() || null
  const linkUrl = (formData.get('link_url') as string)?.trim() || null
  const linkLabel = (formData.get('link_label') as string)?.trim() || null
  const endsAt = formData.get('ends_at') as string

  if (!title || !endsAt) return { error: 'Title and end date are required.' }

  const admin = createBazaarAdmin()
  const { error } = await admin.from('bazaar_promo_banners').insert({
    title, message, link_url: linkUrl, link_label: linkLabel,
    ends_at: new Date(endsAt).toISOString(),
  })
  if (error) return { error: error.message }
  revalidatePath('/admin/banners')
  return { success: true }
}

export async function toggleBanner(id: string, isActive: boolean) {
  if (!(await requireAdmin())) return { error: 'Unauthorized' }
  const admin = createBazaarAdmin()
  const { error } = await admin.from('bazaar_promo_banners').update({ is_active: isActive }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/banners')
  return { success: true }
}

export async function deleteBanner(id: string) {
  if (!(await requireAdmin())) return { error: 'Unauthorized' }
  const admin = createBazaarAdmin()
  const { error } = await admin.from('bazaar_promo_banners').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/banners')
  return { success: true }
}
