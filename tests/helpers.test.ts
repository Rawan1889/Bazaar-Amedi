import { describe, expect, it } from 'vitest'
import { computeDeliveryFee, feeForZone, EXTRA_SHOP_SURCHARGE } from '@/lib/bazaar/zone-utils'
import { safeInternalPath } from '@/lib/bazaar/safe-url'
import { sniffImage } from '@/lib/bazaar/image-sniff'

describe('delivery fee', () => {
  it('uses the most expensive zone involved and adds a surcharge per extra shop', () => {
    const fee = computeDeliveryFee({
      customerZone: { fee: 2000, free_delivery_threshold: null },
      shopZones: [{ fee: 1500 }, { fee: 3000 }],
      subtotal: 10000,
      shopCount: 3,
    })
    expect(fee).toBe(3000 + 2 * EXTRA_SHOP_SURCHARGE)
  })

  it('is free above the customer zone threshold', () => {
    expect(computeDeliveryFee({
      customerZone: { fee: 2000, free_delivery_threshold: 25000 },
      shopZones: [{ fee: 3000 }],
      subtotal: 25000,
      shopCount: 2,
    })).toBe(0)
    expect(feeForZone({ fee: 2000, free_delivery_threshold: 25000 }, 24999)).toBe(2000)
    expect(feeForZone(null, 5000)).toBe(0)
  })
})

describe('safeInternalPath', () => {
  it('keeps links inside the site', () => {
    expect(safeInternalPath('/orders/42')).toBe('/orders/42')
    expect(safeInternalPath('/shop/orders?tab=new')).toBe('/shop/orders?tab=new')
  })
  it('rejects anything that could leave the site', () => {
    for (const bad of ['https://evil.example', '//evil.example', '/\\evil.example', 'javascript:alert(1)', 'orders', '/ok\n//x', '', null, 42]) {
      expect(safeInternalPath(bad)).toBeNull()
    }
  })
})

describe('sniffImage', () => {
  const file = (bytes: number[], type = 'image/png') => new File([new Uint8Array(bytes)], 'x', { type })
  it('recognises real image formats from their bytes', async () => {
    expect(await sniffImage(file([0xff, 0xd8, 0xff, 0xe0]))).toEqual({ mime: 'image/jpeg', ext: 'jpg' })
    expect(await sniffImage(file([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]))).toEqual({ mime: 'image/png', ext: 'png' })
    expect(await sniffImage(file([...Buffer.from('GIF89a')]))).toEqual({ mime: 'image/gif', ext: 'gif' })
    expect(await sniffImage(file([...Buffer.from('RIFF'), 0, 0, 0, 0, ...Buffer.from('WEBP')]))).toEqual({ mime: 'image/webp', ext: 'webp' })
  })
  it('rejects SVG and other files even when they claim to be images', async () => {
    expect(await sniffImage(file([...Buffer.from('<svg xmlns="http://www.w3.org/2000/svg">')], 'image/svg+xml'))).toBeNull()
    expect(await sniffImage(file([...Buffer.from('<html><script>')], 'image/png'))).toBeNull()
  })
})
