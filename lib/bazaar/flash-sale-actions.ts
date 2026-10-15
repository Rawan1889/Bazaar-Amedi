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
  const variantId = (formData.get('variant_id') as string) || null
  const quantityRaw = formData.get('quantity') as string
  const quantity = quantityRaw ? parseInt(quantityRaw, 10) : null

  if (!productId || isNaN(salePrice) || !endsAt) {
    return { error: 'All fields are required.' }
  }
  if (salePrice <= 0) return { error: 'Sale price must be more than 0.' }
  if (quantity !== null && (!Number.isInteger(quantity) || quantity < 1)) {
    return { error: 'Items available must be at least 1.' }
  }
  if (isNaN(new Date(endsAt).getTime()) || new Date(endsAt).getTime() <= Date.now()) {
    return { error: 'The end time must be in the future.' }
  }

  const { data: product } = await supabase
    .from('bazaar_products')
    .select('id, shop_id, price, bazaar_product_variants(id, price)')
    .eq('id', productId)
    .eq('shop_id', shop.id)
    .single()

  if (!product) return { error: 'Product not found in your shop.' }

  const option = variantId
    ? (product.bazaar_product_variants as { id: string; price: number }[] | null)?.find(v => v.id === variantId)
    : null
  if (variantId && !option) return { error: 'That option no longer exists.' }
  const normalPrice = option ? option.price : product.price
  if (salePrice >= normalPrice) {
    return { error: `Sale price must be lower than the normal price (${normalPrice.toLocaleString('en-IQ')} IQD).` }
  }

  const { error } = await supabase.from('bazaar_flash_sales').insert({
    product_id: productId,
    variant_id: variantId,
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
    // Also end it now, so a cancelled order handing units back can't revive it.
    .update({ is_active: false, ends_at: new Date().toISOString() })
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
    .select('id, name_en, price, bazaar_product_variants(id, amount, unit, price)')
    .eq('shop_id', shop.id)
    .eq('in_stock', true)
    .order('name_en')

  return data || []
}
