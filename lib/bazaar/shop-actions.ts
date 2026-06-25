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

export async function updateShopImages(logoUrl: string | null, coverUrl: string | null) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createBazaarServer()

  const update: Record<string, string | null> = {}
  if (logoUrl !== undefined) update.logo_url = logoUrl
  if (coverUrl !== undefined) update.cover_url = coverUrl

  const { error } = await supabase
    .from('bazaar_shops')
    .update(update)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/shop/settings')
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
  const categoryId = (formData.get('category_id') as string) || null
  const description = (formData.get('description') as string)?.trim() || null
  const imageUrl = (formData.get('image_url') as string)?.trim() || null

  type VariantInput = { amount: string; unit: string; price: string; stockQty: string }
  let variants: VariantInput[] = []
  try {
    variants = JSON.parse((formData.get('variants') as string) || '[]')
  } catch { /* ignore */ }

  if (!nameEn) return { error: 'Product name is required.' }
  if (variants.length === 0) return { error: 'Add at least one pricing option.' }

  const validVariants = variants.filter(v => v.price && !isNaN(parseInt(v.price, 10)))
  if (validVariants.length === 0) return { error: 'Each option needs a price.' }

  // Use first variant as the product default price/unit for backward compat
  const firstVariant = validVariants[0]
  const defaultPrice = parseInt(firstVariant.price, 10)
  const defaultUnit = firstVariant.unit || 'piece'

  const { data: product, error: productError } = await supabase
    .from('bazaar_products')
    .insert({
      shop_id: shop.id,
      name_en: nameEn,
      price: defaultPrice,
      unit: defaultUnit,
      category_id: categoryId || null,
      description,
      image_url: imageUrl,
      in_stock: true,
    })
    .select('id')
    .single()

  if (productError) return { error: productError.message }

  // Insert variants
  const variantRows = validVariants.map((v, i) => ({
    product_id: product.id,
    amount: parseFloat(v.amount) || 1,
    unit: v.unit || 'piece',
    price: parseInt(v.price, 10),
    stock_qty: v.stockQty ? parseInt(v.stockQty, 10) : null,
    sort_order: i,
    in_stock: true,
  }))

  await supabase.from('bazaar_product_variants').insert(variantRows)

  revalidatePath('/shop/products')
  return { success: true }
}

export async function updateProductImage(productId: string, imageUrl: string) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createBazaarServer()
  const { error } = await supabase
    .from('bazaar_products')
    .update({ image_url: imageUrl })
    .eq('id', productId)

  if (error) return { error: error.message }
  revalidatePath('/shop/products')
  return { success: true }
}

// Add an extra gallery image to a product.
export async function addProductImage(productId: string, url: string) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createBazaarServer()
  const { count } = await supabase
    .from('bazaar_product_images')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId)

  const { error } = await supabase
    .from('bazaar_product_images')
    .insert({ product_id: productId, url, sort_order: count ?? 0 })

  if (error) return { error: error.message }
  revalidatePath('/shop/products')
  return { success: true }
}

export async function deleteProductImage(imageId: string) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createBazaarServer()
  const { error } = await supabase
    .from('bazaar_product_images')
    .delete()
    .eq('id', imageId)

  if (error) return { error: error.message }
  revalidatePath('/shop/products')
  return { success: true }
}

export async function getProductImages(productId: string) {
  const supabase = await createBazaarServer()
  const { data } = await supabase
    .from('bazaar_product_images')
    .select('id, url, sort_order')
    .eq('product_id', productId)
    .order('sort_order')
  return data || []
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
