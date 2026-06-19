'use server'

import { revalidatePath } from 'next/cache'
import { createBazaarServer, createBazaarAdmin } from './supabase-server'
import { getBazaarUser } from './auth'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

export async function updateShop(formData: FormData) {
  const user = await getBazaarUser()
  if (!user || (user.role !== 'market_admin' && user.role !== 'super_admin')) {
    return { error: 'Unauthorized' }
  }

  const supabase = await createBazaarServer()

  const name = (formData.get('name') as string).trim()
  const description = (formData.get('description') as string)?.trim() || null
  const phone = (formData.get('phone') as string)?.trim() || null
  const address = (formData.get('address') as string)?.trim() || null
  const categoryId = (formData.get('category_id') as string) || null
  const isOpen = formData.get('is_open') === 'true'

  const { data: existing } = await supabase
    .from('bazaar_shops')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('bazaar_shops')
      .update({ name, description, phone, address, category_id: categoryId, is_open: isOpen })
      .eq('id', existing.id)

    if (error) return { error: error.message }
  } else {
    const slug = slugify(name) || `shop-${user.id.slice(0, 8)}`
    const { error } = await supabase
      .from('bazaar_shops')
      .insert({
        owner_id: user.id,
        name,
        slug,
        description,
        phone,
        address,
        category_id: categoryId,
        is_open: isOpen,
        is_approved: false,
      })

    if (error) return { error: error.message }
  }

  revalidatePath('/shop')
  return { success: true }
}

export async function addProduct(formData: FormData) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createBazaarServer()

  const { data: shop } = await supabase
    .from('bazaar_shops')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!shop) return { error: 'Create your shop first.' }

  const nameEn = (formData.get('name_en') as string).trim()
  const price = parseInt(formData.get('price') as string, 10)
  const unit = (formData.get('unit') as string) || 'piece'
  const categoryId = (formData.get('category_id') as string) || null
  const description = (formData.get('description') as string)?.trim() || null
  const imageUrl = (formData.get('image_url') as string)?.trim() || null

  if (!nameEn || isNaN(price)) {
    return { error: 'Name and price are required.' }
  }

  const { error } = await supabase.from('bazaar_products').insert({
    shop_id: shop.id,
    name_en: nameEn,
    price,
    unit,
    category_id: categoryId || null,
    description,
    image_url: imageUrl,
    in_stock: true,
  })

  if (error) return { error: error.message }

  revalidatePath('/shop/products')
  return { success: true }
}

export async function updateProduct(formData: FormData) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createBazaarServer()
  const productId = formData.get('product_id') as string
  const nameEn = (formData.get('name_en') as string).trim()
  const price = parseInt(formData.get('price') as string, 10)
  const unit = (formData.get('unit') as string) || 'piece'
  const categoryId = (formData.get('category_id') as string) || null
  const description = (formData.get('description') as string)?.trim() || null
  const inStock = formData.get('in_stock') === 'true'

  const { error } = await supabase
    .from('bazaar_products')
    .update({ name_en: nameEn, price, unit, category_id: categoryId || null, description, in_stock: inStock })
    .eq('id', productId)

  if (error) return { error: error.message }

  revalidatePath('/shop/products')
  return { success: true }
}

export async function deleteProduct(formData: FormData) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createBazaarServer()
  const productId = formData.get('product_id') as string

  const { error } = await supabase
    .from('bazaar_products')
    .delete()
    .eq('id', productId)

  if (error) return { error: error.message }

  revalidatePath('/shop/products')
  return { success: true }
}

export async function toggleProductStock(formData: FormData) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createBazaarServer()
  const productId = formData.get('product_id') as string
  const inStock = formData.get('in_stock') === 'true'

  await supabase
    .from('bazaar_products')
    .update({ in_stock: !inStock })
    .eq('id', productId)

  revalidatePath('/shop/products')
}
