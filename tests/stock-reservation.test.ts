import { describe, expect, it } from 'vitest'
import { adjustCounter, reserveStock, type PricedItem } from '@/lib/bazaar/order-pricing'
import { fakeSupabase } from './fake-supabase'

const item = (over: Partial<PricedItem> = {}): PricedItem => ({
  productId: 'p', shopId: 's', name: 'Croissant', unitPrice: 750, quantity: 1,
  stockVariantId: 'v1', limitedSaleId: null, ...over,
})

describe('stock reservation', () => {
  it('lets only one of two simultaneous orders take the last unit', async () => {
    const { client, row } = fakeSupabase({ bazaar_product_variants: [{ id: 'v1', stock_qty: 1, in_stock: true }] })
    const [a, b] = await Promise.all([reserveStock(client, [item()]), reserveStock(client, [item()])])
    const wins = [a, b].filter(r => 'reserved' in r)
    expect(wins).toHaveLength(1)
    expect(row('bazaar_product_variants', 'v1')).toMatchObject({ stock_qty: 0, in_stock: false })
  })

  it('never takes more than is in stock under heavy concurrency', async () => {
    const { client, row } = fakeSupabase({ bazaar_product_variants: [{ id: 'v1', stock_qty: 3, in_stock: true }] })
    const results = await Promise.all(Array.from({ length: 8 }, () => reserveStock(client, [item()])))
    expect(results.filter(r => 'reserved' in r)).toHaveLength(3)
    expect(row('bazaar_product_variants', 'v1').stock_qty).toBe(0)
  })

  it('releases earlier reservations when a later item is short', async () => {
    const { client, row } = fakeSupabase({
      bazaar_product_variants: [{ id: 'v1', stock_qty: 5, in_stock: true }, { id: 'v2', stock_qty: 0, in_stock: false }],
    })
    const r = await reserveStock(client, [item({ quantity: 2 }), item({ stockVariantId: 'v2', name: 'Bread' })])
    expect(r).toEqual({ error: expect.stringContaining('Bread') })
    expect(row('bazaar_product_variants', 'v1')).toMatchObject({ stock_qty: 5, in_stock: true })
  })

  it('reserves flash-sale quantity and deactivates the sale when it runs out', async () => {
    const { client, row } = fakeSupabase({
      bazaar_product_variants: [{ id: 'v1', stock_qty: null, in_stock: true }],
      bazaar_flash_sales: [{ id: 's1', quantity: 2, is_active: true }],
    })
    const r = await reserveStock(client, [item({ quantity: 2, limitedSaleId: 's1' })])
    expect(r).toHaveProperty('reserved')
    expect(row('bazaar_flash_sales', 's1')).toMatchObject({ quantity: 0, is_active: false })
  })

  it('treats untracked stock (null) as unlimited', async () => {
    const { client } = fakeSupabase({ bazaar_product_variants: [{ id: 'v1', stock_qty: null, in_stock: true }] })
    expect(await adjustCounter(client, { table: 'bazaar_product_variants', id: 'v1' }, -50)).toBe(true)
  })
})
