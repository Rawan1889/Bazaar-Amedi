import { describe, expect, it } from 'vitest'
import { priceCartLines, validateCartLines, type ProductRow } from '@/lib/bazaar/order-pricing'

const NOW = Date.parse('2026-09-30T12:00:00Z')
const future = '2026-10-01T00:00:00Z'
const past = '2026-09-29T00:00:00Z'

function product(over: Partial<ProductRow> = {}): ProductRow {
  return {
    id: 'bread',
    shop_id: 'renas-bakery',
    name_en: 'Arabic bread',
    price: 250,
    in_stock: true,
    bazaar_shops: { is_approved: true },
    bazaar_product_variants: [],
    bazaar_flash_sales: [],
    ...over,
  }
}

describe('validateCartLines', () => {
  it('rejects empty carts, bad quantities and oversized carts', () => {
    expect(validateCartLines([])).toBe('Cart is empty.')
    expect(validateCartLines([{ productId: 'a', quantity: 0 }])).toBe('Invalid item quantity.')
    expect(validateCartLines([{ productId: 'a', quantity: -3 }])).toBe('Invalid item quantity.')
    expect(validateCartLines([{ productId: 'a', quantity: 1.5 }])).toBe('Invalid item quantity.')
    expect(validateCartLines([{ productId: 'a', quantity: 100 }])).toBe('Invalid item quantity.')
    expect(validateCartLines(Array.from({ length: 101 }, () => ({ productId: 'a', quantity: 1 })))).toBe('Too many items in one order.')
    expect(validateCartLines([{ productId: 'a', quantity: 2 }])).toBeNull()
  })
})

describe('priceCartLines', () => {
  it('uses the database price and shop, ignoring anything the browser sent', () => {
    const tampered = { productId: 'bread', quantity: 4, price: 1, salePrice: 1, shopId: 'other-shop', name: 'free' }
    const r = priceCartLines([product()], [tampered], NOW)
    expect(r).toEqual({ items: [expect.objectContaining({ unitPrice: 250, shopId: 'renas-bakery', name: 'Arabic bread', quantity: 4 })] })
  })

  it('prices a chosen variant and names it', () => {
    const p = product({ bazaar_product_variants: [
      { id: 'v-small', amount: 1, unit: 'kg', price: 250, stock_qty: null, in_stock: true },
      { id: 'v-big', amount: 5, unit: 'kg', price: 1100, stock_qty: 10, in_stock: true },
    ] })
    const r = priceCartLines([p], [{ productId: 'bread', variantId: 'v-big', quantity: 2 }], NOW)
    expect(r).toEqual({ items: [expect.objectContaining({ unitPrice: 1100, name: 'Arabic bread (5 kg)', stockVariantId: 'v-big' })] })
  })

  it('rejects a variant that no longer exists', () => {
    const r = priceCartLines([product()], [{ productId: 'bread', variantId: 'gone', quantity: 1 }], NOW)
    expect(r).toHaveProperty('error')
  })

  it('applies an active flash sale but not an expired one', () => {
    const active = product({ bazaar_flash_sales: [{ id: 's1', sale_price: 200, ends_at: future, is_active: true, quantity: null }] })
    const expired = product({ bazaar_flash_sales: [{ id: 's1', sale_price: 200, ends_at: past, is_active: true, quantity: null }] })
    expect(priceCartLines([active], [{ productId: 'bread', quantity: 1 }], NOW)).toEqual({ items: [expect.objectContaining({ unitPrice: 200, limitedSaleId: null })] })
    expect(priceCartLines([expired], [{ productId: 'bread', quantity: 1 }], NOW)).toEqual({ items: [expect.objectContaining({ unitPrice: 250 })] })
  })

  it('never lets a sale price exceed the normal price', () => {
    const p = product({ bazaar_flash_sales: [{ id: 's1', sale_price: 900, ends_at: future, is_active: true, quantity: null }] })
    expect(priceCartLines([p], [{ productId: 'bread', quantity: 1 }], NOW)).toEqual({ items: [expect.objectContaining({ unitPrice: 250 })] })
  })

  it('refuses more units than a limited flash sale has left', () => {
    const p = product({ bazaar_flash_sales: [{ id: 's1', sale_price: 200, ends_at: future, is_active: true, quantity: 3 }] })
    expect(priceCartLines([p], [{ productId: 'bread', quantity: 4 }], NOW)).toHaveProperty('error')
    expect(priceCartLines([p], [{ productId: 'bread', quantity: 3 }], NOW)).toEqual({ items: [expect.objectContaining({ limitedSaleId: 's1' })] })
  })

  it('counts stock across repeated cart lines for the same variant', () => {
    const p = product({ bazaar_product_variants: [{ id: 'v1', amount: 1, unit: 'piece', price: 250, stock_qty: 5, in_stock: true }] })
    const lines = [{ productId: 'bread', quantity: 3 }, { productId: 'bread', quantity: 3 }]
    expect(priceCartLines([p], lines, NOW)).toHaveProperty('error')
  })

  it('rejects out-of-stock products and shops that are not approved', () => {
    expect(priceCartLines([product({ in_stock: false })], [{ productId: 'bread', quantity: 1 }], NOW)).toHaveProperty('error')
    expect(priceCartLines([product({ bazaar_shops: { is_approved: false } })], [{ productId: 'bread', quantity: 1 }], NOW)).toHaveProperty('error')
    expect(priceCartLines([], [{ productId: 'bread', quantity: 1 }], NOW)).toHaveProperty('error')
  })
})
