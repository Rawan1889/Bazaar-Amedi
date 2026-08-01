'use server'

import { revalidatePath } from 'next/cache'
import { createBazaarServer, createBazaarAdmin } from './supabase-server'
import { getBazaarUser } from './auth'
import { sendPushToUser } from './push-notifications'

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

  const { data: shop } = await supabase
    .from('bazaar_shops')
    .select('owner_id, name')
    .eq('id', shopId)
    .single()

  const { error } = await supabase
    .from('bazaar_shops')
    .update({ is_approved: true })
    .eq('id', shopId)

  if (error) return { error: error.message }

  if (shop) {
    sendPushToUser(shop.owner_id, {
      type: 'shop_approved',
      title: 'Your shop is approved!',
      body: `${shop.name} is now live on Bazaar Amedi. Customers can find and order from your shop.`,
      url: '/shop',
    })
  }

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

export async function getAllUsers() {
  await requireAdmin()
  const supabase = await createBazaarServer()
  const { data } = await supabase
    .from('bazaar_profiles')
    .select('*')
    .order('created_at', { ascending: false })
  return data || []
}

export async function suspendUser(userId: string) {
  await requireAdmin()
  const supabase = createBazaarAdmin()
  await supabase.from('bazaar_profiles').update({ is_suspended: true }).eq('id', userId)
  revalidatePath('/admin/users')
}

export async function unsuspendUser(userId: string) {
  await requireAdmin()
  const supabase = createBazaarAdmin()
  await supabase.from('bazaar_profiles').update({ is_suspended: false }).eq('id', userId)
  revalidatePath('/admin/users')
}

export async function approveDriver(userId: string) {
  await requireAdmin()
  const supabase = createBazaarAdmin()
  await supabase.from('bazaar_profiles').update({ is_approved: true }).eq('id', userId)
  revalidatePath('/admin/users')
}

export async function changeUserRole(userId: string, role: string) {
  await requireAdmin()
  const supabase = createBazaarAdmin()
  await supabase.from('bazaar_profiles').update({ role }).eq('id', userId)
  revalidatePath('/admin/users')
}

export async function adminCancelOrder(orderId: string, reason?: string) {
  await requireAdmin()
  const supabase = createBazaarAdmin()

  const { data: order } = await supabase
    .from('bazaar_orders')
    .select('id, order_number, status, customer_id, driver_id')
    .eq('id', orderId)
    .single()
  if (!order || order.status === 'cancelled') {
    revalidatePath('/admin/orders')
    return
  }

  const { data: items } = await supabase
    .from('bazaar_order_items')
    .select('shop_id, bazaar_shops(owner_id)')
    .eq('order_id', orderId)

  await supabase.from('bazaar_orders').update({ status: 'cancelled' }).eq('id', orderId)

  const body = reason ? `Order cancelled by admin — ${reason}` : `Order cancelled by admin.`
  sendPushToUser(order.customer_id, {
    type: 'order_status',
    title: `Order #${order.order_number} cancelled`,
    body,
    url: `/orders/${orderId}`,
  })
  if (order.driver_id) {
    sendPushToUser(order.driver_id, {
      type: 'order_status',
      title: `Order #${order.order_number} cancelled`,
      body,
      url: `/driver`,
    })
  }
  const notified = new Set<string>()
  for (const it of (items || [])) {
    const ownerId = (it as unknown as { bazaar_shops?: { owner_id?: string } | null }).bazaar_shops?.owner_id
    if (ownerId && !notified.has(ownerId)) {
      notified.add(ownerId)
      sendPushToUser(ownerId, {
        type: 'order_status',
        title: `Order #${order.order_number} cancelled`,
        body,
        url: `/shop/orders`,
      })
    }
  }

  revalidatePath('/admin/orders')
  revalidatePath('/shop/orders')
  revalidatePath('/driver')
  revalidatePath('/orders')
  revalidatePath(`/orders/${orderId}`)
}

export async function adminSetOrderStatus(orderId: string, status: string) {
  await requireAdmin()
  const supabase = await createBazaarServer()
  await supabase.from('bazaar_orders').update({ status }).eq('id', orderId)
  revalidatePath('/admin/orders')
}
