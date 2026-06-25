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

// --- Bulk CSV import -------------------------------------------------

// Minimal RFC-4180-ish CSV parser: handles quoted fields, escaped quotes
// (""), and commas/newlines inside quotes.
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  const s = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += ch
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field); field = ''
    } else if (ch === '\n') {
      row.push(field); field = ''
      if (row.some(c => c.trim() !== '')) rows.push(row)
      row = []
    } else field += ch
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    if (row.some(c => c.trim() !== '')) rows.push(row)
  }
  return rows
}

export interface BulkImportResult {
  added: number
  skipped: { row: number; reason: string }[]
  error?: string
}

export async function bulkImportProducts(csvText: string): Promise<BulkImportResult> {
  const user = await getBazaarUser()
  if (!user) return { added: 0, skipped: [], error: 'Unauthorized' }

  const supabase = await createBazaarServer()

  const { data: shop } = await supabase
    .from('bazaar_shops')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!shop) return { added: 0, skipped: [], error: 'Create your shop first.' }

  const rows = parseCsv(csvText)
  if (rows.length < 2) return { added: 0, skipped: [], error: 'CSV needs a header row and at least one product row.' }

  // Map header names → column index (case/space-insensitive).
  const header = rows[0].map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))
  const col = (name: string) => header.indexOf(name)
  const iName = col('name_en') >= 0 ? col('name_en') : col('name')
  const iPrice = col('price')
  if (iName < 0 || iPrice < 0) {
    return { added: 0, skipped: [], error: 'CSV must include at least "name_en" and "price" columns.' }
  }
  const iKu = col('name_ku'), iAr = col('name_ar'), iUnit = col('unit')
  const iStock = col('stock_qty'), iCat = col('category'), iDesc = col('description')

  // Resolve category names/slugs to ids once.
  const { data: cats } = await supabase.from('bazaar_categories').select('id, name_en, slug')
  const catMap = new Map<string, string>()
  for (const cdata of (cats || []) as { id: string; name_en: string; slug: string }[]) {
    catMap.set(cdata.name_en.trim().toLowerCase(), cdata.id)
    if (cdata.slug) catMap.set(cdata.slug.trim().toLowerCase(), cdata.id)
  }

  const get = (r: string[], i: number) => (i >= 0 && i < r.length ? r[i].trim() : '')
  const skipped: BulkImportResult['skipped'] = []
  let added = 0

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    const nameEn = get(row, iName)
    const priceRaw = get(row, iPrice)
    const price = parseInt(priceRaw.replace(/[^\d]/g, ''), 10)

    if (!nameEn) { skipped.push({ row: r + 1, reason: 'missing name' }); continue }
    if (!priceRaw || isNaN(price)) { skipped.push({ row: r + 1, reason: 'missing/invalid price' }); continue }

    const unit = get(row, iUnit) || 'piece'
    const stockRaw = get(row, iStock)
    const stockQty = stockRaw ? parseInt(stockRaw.replace(/[^\d]/g, ''), 10) : null
    const categoryId = catMap.get(get(row, iCat).toLowerCase()) ?? null

    const { data: product, error: pErr } = await supabase
      .from('bazaar_products')
      .insert({
        shop_id: shop.id,
        name_en: nameEn,
        name_ku: get(row, iKu) || null,
        name_ar: get(row, iAr) || null,
        price,
        unit,
        category_id: categoryId,
        description: get(row, iDesc) || null,
        in_stock: true,
      })
      .select('id')
      .single()

    if (pErr || !product) { skipped.push({ row: r + 1, reason: pErr?.message || 'insert failed' }); continue }

    await supabase.from('bazaar_product_variants').insert({
      product_id: product.id,
      amount: 1,
      unit,
      price,
      stock_qty: stockQty != null && !isNaN(stockQty) ? stockQty : null,
      sort_order: 0,
      in_stock: true,
    })
    added++
  }

  revalidatePath('/shop/products')
  return { added, skipped }
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
