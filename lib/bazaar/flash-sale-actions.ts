'use server'

import { revalidatePath } from 'next/cache'
import { createBazaarServer } from './supabase-server'
import { getBazaarUser } from './auth'

export async function createFlashSale(formData: FormData) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createBazaarServer()

  const { data: shop } = await supabase
    .from('bazaar_shops')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!shop) return { error: 'No shop found' }

  const productId = formData.get('product_id') as string
  const salePrice = parseInt(formData.get('sale_price') as string, 10)
  const endsAt = formData.get('ends_at') as string
  const quantityRaw = formData.get('quantity') as string
  const quantity = quantityRaw ? parseInt(quantityRaw, 10) : null

  if (!productId || isNaN(salePrice) || !endsAt) {
    return { error: 'All fields are required.' }
  }

  const { data: product } = await supabase
    .from('bazaar_products')
    .select('id, shop_id')
    .eq('id', productId)
    .eq('shop_id', shop.id)
    .single()

  if (!product) return { error: 'Product not found in your shop.' }

  const { error } = await supabase.from('bazaar_flash_sales').insert({
    product_id: productId,
    sale_price: salePrice,
    quantity,
    starts_at: new Date().toISOString(),
    ends_at: new Date(endsAt).toISOString(),
    is_active: true,
  })

  if (error) return { error: error.message }

  revalidatePath('/shop/flash-sales')
  revalidatePath('/browse')
  return { success: true }
}

export async function endFlashSale(saleId: string) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createBazaarServer()

  const { error } = await supabase
    .from('bazaar_flash_sales')
    .update({ is_active: false })
    .eq('id', saleId)

  if (error) return { error: error.message }

  revalidatePath('/shop/flash-sales')
  revalidatePath('/browse')
  return { success: true }
}

export async function getShopFlashSales() {
  const user = await getBazaarUser()
  if (!user) return []

  const supabase = await createBazaarServer()

  const { data: shop } = await supabase
    .from('bazaar_shops')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!shop) return []

  const { data } = await supabase
    .from('bazaar_flash_sales')
    .select('*, bazaar_products!inner(name_en, price, unit, shop_id)')
    .eq('bazaar_products.shop_id', shop.id)
    .order('created_at', { ascending: false })

  return data || []
}

export async function getShopProducts() {
  const user = await getBazaarUser()
  if (!user) return []

  const supabase = await createBazaarServer()

  const { data: shop } = await supabase
    .from('bazaar_shops')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!shop) return []

  const { data } = await supabase
    .from('bazaar_products')
    .select('id, name_en, price')
    .eq('shop_id', shop.id)
    .eq('in_stock', true)
    .order('name_en')

  return data || []
}
