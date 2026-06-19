'use server'

import { createBazaarServer } from './supabase-server'

export async function searchProducts(query: string) {
  if (!query || query.trim().length < 2) return []

  const supabase = await createBazaarServer()
  const q = query.trim()

  const { data } = await supabase
    .from('bazaar_products')
    .select('id, name_en, price, unit, image_url, shop_id, bazaar_shops!inner(name, slug, is_open, is_approved), bazaar_flash_sales(sale_price, ends_at, is_active)')
    .eq('in_stock', true)
    .eq('bazaar_shops.is_approved', true)
    .ilike('name_en', `%${q}%`)
    .order('name_en')
    .limit(20)

  return data || []
}
