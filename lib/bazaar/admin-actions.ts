'use server'

import { revalidatePath } from 'next/cache'
import { createBazaarServer } from './supabase-server'
import { getBazaarUser } from './auth'

async function requireAdmin() {
  const user = await getBazaarUser()
  if (!user || user.role !== 'super_admin') {
    throw new Error('Unauthorized')
  }
  return user
}

export async function getAllShops() {
  await requireAdmin()
  const supabase = await createBazaarServer()

  const { data } = await supabase
    .from('bazaar_shops')
    .select('*, bazaar_profiles!bazaar_shops_owner_id_fkey(full_name, phone), bazaar_categories(name_en)')
    .order('created_at', { ascending: false })

  return data || []
}

export async function approveShop(shopId: string) {
  await requireAdmin()
  const supabase = await createBazaarServer()

  const { error } = await supabase
    .from('bazaar_shops')
    .update({ is_approved: true })
    .eq('id', shopId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

export async function rejectShop(shopId: string) {
  await requireAdmin()
  const supabase = await createBazaarServer()

  const { error } = await supabase
    .from('bazaar_shops')
    .update({ is_approved: false })
    .eq('id', shopId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

export async function getAllOrders() {
  await requireAdmin()
  const supabase = await createBazaarServer()

  const { data } = await supabase
    .from('bazaar_orders')
    .select('*, bazaar_profiles!bazaar_orders_customer_id_fkey(full_name, phone), bazaar_order_items(product_name, quantity, unit_price, bazaar_shops(name))')
    .order('created_at', { ascending: false })
    .limit(50)

  return data || []
}

export async function getAllCategories() {
  await requireAdmin()
  const supabase = await createBazaarServer()

  const { data } = await supabase
    .from('bazaar_categories')
    .select('*')
    .order('sort_order')

  return data || []
}

export async function addCategory(formData: FormData) {
  await requireAdmin()
  const supabase = await createBazaarServer()

  const nameEn = (formData.get('name_en') as string).trim()
  const nameKu = (formData.get('name_ku') as string)?.trim() || null
  const nameAr = (formData.get('name_ar') as string)?.trim() || null
  const slug = nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  if (!nameEn) return { error: 'English name is required.' }

  const { data: maxOrder } = await supabase
    .from('bazaar_categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const { error } = await supabase.from('bazaar_categories').insert({
    name_en: nameEn,
    name_ku: nameKu,
    name_ar: nameAr,
    slug,
    sort_order: (maxOrder?.sort_order || 0) + 1,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath('/browse')
  return { success: true }
}

export async function deleteCategory(categoryId: string) {
  await requireAdmin()
  const supabase = await createBazaarServer()

  const { error } = await supabase
    .from('bazaar_categories')
    .delete()
    .eq('id', categoryId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath('/browse')
  return { success: true }
}

export async function getAdminStats() {
  await requireAdmin()
  const supabase = await createBazaarServer()

  const [shops, products, orders, profiles] = await Promise.all([
    supabase.from('bazaar_shops').select('*', { count: 'exact', head: true }),
    supabase.from('bazaar_products').select('*', { count: 'exact', head: true }),
    supabase.from('bazaar_orders').select('*', { count: 'exact', head: true }),
    supabase.from('bazaar_profiles').select('*', { count: 'exact', head: true }),
  ])

  const { data: pendingShops } = await supabase
    .from('bazaar_shops')
    .select('*', { count: 'exact', head: true })
    .eq('is_approved', false)

  return {
    totalShops: shops.count || 0,
    totalProducts: products.count || 0,
    totalOrders: orders.count || 0,
    totalUsers: profiles.count || 0,
    pendingShops: pendingShops?.length || 0,
  }
}
