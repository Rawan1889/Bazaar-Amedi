// Checkout pricing and stock reservation. Kept free of 'use server' and
// Next.js imports so it can be unit-tested without a database.
import type { SupabaseClient } from '@supabase/supabase-js'
import { saleForOption, flashSalePrice, defaultVariant } from './flash-sale-price'

export type CartLine = { productId: string; variantId?: string; quantity: number }

export type ProductRow = {
  id: string
  shop_id: string
  name_en: string
  price: number
  in_stock: boolean | null
  bazaar_shops: { is_approved: boolean | null; is_paused?: boolean | null } | null
  bazaar_product_variants: { id: string; amount: number; unit: string; price: number; stock_qty: number | null; in_stock: boolean | null }[] | null
  bazaar_flash_sales: { id: string; sale_price: number; ends_at: string; is_active: boolean | null; quantity: number | null; variant_id?: string | null }[] | null
}

export const PRODUCT_PRICING_SELECT =
  'id, shop_id, name_en, price, in_stock, bazaar_shops(is_approved, is_paused), bazaar_product_variants(id, amount, unit, price, stock_qty, in_stock), bazaar_flash_sales(id, sale_price, ends_at, is_active, quantity, variant_id)'

export type PricedItem = {
  productId: string
  shopId: string
  name: string
  unitPrice: number
  quantity: number
  // The option sold and the flash sale applied, recorded on the order item so
  // a cancellation can hand the units back.
  variantId: string | null
  flashSaleId: string | null
  // Set only when that counter is actually tracked (non-null), i.e. needs reserving.
  stockVariantId: string | null
  limitedSaleId: string | null
}

export const MAX_LINES = 100
export const MAX_QTY_PER_LINE = 99

export function validateCartLines(lines: CartLine[]): string | null {
  if (!lines.length) return 'Cart is empty.'
  if (lines.length > MAX_LINES) return 'Too many items in one order.'
  for (const l of lines) {
    if (!Number.isInteger(l.quantity) || l.quantity < 1 || l.quantity > MAX_QTY_PER_LINE) {
      return 'Invalid item quantity.'
    }
  }
  return null
}

// Price every cart line from database rows only. Nothing price-related from
// the browser is trusted — just productId, variantId and quantity.
export function priceCartLines(
  products: ProductRow[],
  lines: CartLine[],
  now: number,
): { items: PricedItem[] } | { error: string } {
  const byId = new Map(products.map(p => [p.id, p]))
  const items: PricedItem[] = []
  const demandByVariant = new Map<string, number>()

  for (const line of lines) {
    const p = byId.get(line.productId)
    if (!p || !p.bazaar_shops?.is_approved || p.bazaar_shops.is_paused) {
      return { error: 'An item in your cart is no longer available. Please remove it and try again.' }
    }
    const variants = p.bazaar_product_variants ?? []
    let chosen: (typeof variants)[number] | null = null
    if (line.variantId) {
      chosen = variants.find(v => v.id === line.variantId) ?? null
      if (!chosen) return { error: `"${p.name_en}" has changed. Please remove it and add it again.` }
    }
    // Stock is tracked on the chosen variant, or the product's default variant.
    const stockVariant = chosen ?? defaultVariant(p.price, variants)

    if (p.in_stock === false || (stockVariant && stockVariant.in_stock === false && (stockVariant.stock_qty ?? 0) <= 0)) {
      return { error: `Sorry, "${p.name_en}" is currently out of stock.` }
    }

    const basePrice = chosen ? chosen.price : p.price
    const sale = saleForOption(p.bazaar_flash_sales, stockVariant?.id ?? null, now)
    if (sale && sale.quantity !== null && sale.quantity < line.quantity) {
      return { error: `Only ${sale.quantity} of "${p.name_en}" left at the flash-sale price.` }
    }

    if (stockVariant && stockVariant.stock_qty !== null) {
      const demand = (demandByVariant.get(stockVariant.id) ?? 0) + line.quantity
      if (demand > stockVariant.stock_qty) {
        return { error: `Sorry, only ${stockVariant.stock_qty} unit(s) of "${p.name_en}" are available in stock.` }
      }
      demandByVariant.set(stockVariant.id, demand)
    }

    items.push({
      productId: p.id,
      shopId: p.shop_id,
      name: chosen ? `${p.name_en} (${chosen.amount} ${chosen.unit})` : p.name_en,
      unitPrice: sale ? flashSalePrice(sale, p.price, basePrice) : basePrice,
      quantity: line.quantity,
      variantId: stockVariant?.id ?? null,
      flashSaleId: sale?.id ?? null,
      stockVariantId: stockVariant && stockVariant.stock_qty !== null ? stockVariant.id : null,
      limitedSaleId: sale && sale.quantity !== null ? sale.id : null,
    })
  }
  return { items }
}

export type Counter = { table: 'bazaar_product_variants' | 'bazaar_flash_sales'; id: string; qty: number }

// Atomically add `delta` to a stock counter using compare-and-swap: the UPDATE
// only applies if the value is still what we just read, so two simultaneous
// orders can't both take the last unit. Retries when another order wins the race.
export async function adjustCounter(
  client: SupabaseClient,
  { table, id }: Omit<Counter, 'qty'>,
  delta: number,
): Promise<boolean> {
  const col = table === 'bazaar_flash_sales' ? 'quantity' : 'stock_qty'
  const flag = table === 'bazaar_flash_sales' ? 'is_active' : 'in_stock'
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: row } = await client.from(table).select(col).eq('id', id).single()
    const current = (row as Record<string, number | null> | null)?.[col]
    if (current === null || current === undefined) return true
    const next = current + delta
    if (next < 0) return false
    // Flip the in-stock/active flag only when crossing zero, so units handed
    // back by a cancellation don't switch on an option the shop turned off.
    const patch: Record<string, number | boolean> = { [col]: next }
    if (next === 0) patch[flag] = false
    else if (current === 0) patch[flag] = true
    const { data: updated } = await client
      .from(table)
      .update(patch)
      .eq('id', id)
      .eq(col, current)
      .select('id')
    if (updated?.length) return true
  }
  return false
}

export async function releaseCounters(client: SupabaseClient, counters: Counter[]) {
  for (const ctr of counters) await adjustCounter(client, ctr, ctr.qty)
}

// Reserve every tracked counter for the priced items, or none: on the first
// shortage, everything already reserved is released.
export async function reserveStock(
  client: SupabaseClient,
  items: PricedItem[],
): Promise<{ reserved: Counter[] } | { error: string }> {
  const reserved: Counter[] = []
  for (const item of items) {
    const wanted: Counter[] = [
      ...(item.stockVariantId ? [{ table: 'bazaar_product_variants' as const, id: item.stockVariantId, qty: item.quantity }] : []),
      ...(item.limitedSaleId ? [{ table: 'bazaar_flash_sales' as const, id: item.limitedSaleId, qty: item.quantity }] : []),
    ]
    for (const ctr of wanted) {
      if (!(await adjustCounter(client, ctr, -ctr.qty))) {
        await releaseCounters(client, reserved)
        return { error: `Sorry, "${item.name}" just sold out. Please update your cart.` }
      }
      reserved.push(ctr)
    }
  }
  return { reserved }
}

// --- Coupons -----------------------------------------------------------

export type CouponRow = {
  id: string
  shop_id: string
  discount_type: string
  discount_value: number
  min_order: number | null
  max_uses: number | null
  uses_count: number | null
  is_active: boolean | null
  expires_at: string | null
}

// A coupon belongs to one shop, so it only discounts that shop's items —
// shop A's coupon never comes out of shop B's sales.
export function couponDiscount(
  coupon: CouponRow,
  shopSubtotal: number,
  now: number,
): { discount: number } | { error: string } {
  if (!coupon.is_active) return { error: 'Invalid or expired coupon code.' }
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < now) {
    return { error: 'This coupon has expired.' }
  }
  if (coupon.max_uses !== null && (coupon.uses_count ?? 0) >= coupon.max_uses) {
    return { error: 'This coupon has reached its usage limit.' }
  }
  const minOrder = coupon.min_order ?? 0
  if (minOrder > 0 && shopSubtotal < minOrder) {
    return { error: `This coupon needs ${minOrder.toLocaleString('en-IQ')} IQD from the shop that issued it.` }
  }
  const discount = coupon.discount_type === 'percentage'
    ? Math.round(shopSubtotal * (coupon.discount_value / 100))
    : Math.min(coupon.discount_value, shopSubtotal)
  return { discount: Math.max(0, Math.min(discount, shopSubtotal)) }
}

// Count one use of a coupon (delta 1) or give one back (delta -1). Uses
// compare-and-swap like adjustCounter, and refuses a use past max_uses, so two
// orders can't both take a coupon's last use.
export async function adjustCouponUses(client: SupabaseClient, couponId: string, delta: 1 | -1): Promise<boolean> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: row } = await client
      .from('bazaar_coupons')
      .select('uses_count, max_uses')
      .eq('id', couponId)
      .single()
    if (!row) return false
    const used = (row as { uses_count: number | null }).uses_count ?? 0
    const max = (row as { max_uses: number | null }).max_uses
    if (delta > 0 && max !== null && used >= max) return false
    const next = Math.max(0, used + delta)
    let q = client.from('bazaar_coupons').update({ uses_count: next }).eq('id', couponId)
    q = (row as { uses_count: number | null }).uses_count === null ? q.is('uses_count', null) : q.eq('uses_count', used)
    const { data: updated } = await q.select('id')
    if (updated?.length) return true
  }
  return false
}

// Give back what an order held: the stock and limited flash-sale units it
// reserved, and its coupon use. Call it once, right after the order moves to
// 'cancelled' (the status guard on that update makes sure only one caller does).
export async function releaseOrderHolds(client: SupabaseClient, orderId: string) {
  const [{ data: items }, { data: order }] = await Promise.all([
    client.from('bazaar_order_items').select('variant_id, flash_sale_id, quantity').eq('order_id', orderId),
    client.from('bazaar_orders').select('coupon_id').eq('id', orderId).single(),
  ])
  const counters: Counter[] = []
  for (const it of (items as { variant_id: string | null; flash_sale_id: string | null; quantity: number }[] | null) ?? []) {
    if (it.variant_id) counters.push({ table: 'bazaar_product_variants', id: it.variant_id, qty: it.quantity })
    if (it.flash_sale_id) counters.push({ table: 'bazaar_flash_sales', id: it.flash_sale_id, qty: it.quantity })
  }
  await releaseCounters(client, counters)
  const couponId = (order as { coupon_id: string | null } | null)?.coupon_id
  if (couponId) await adjustCouponUses(client, couponId, -1)
}
