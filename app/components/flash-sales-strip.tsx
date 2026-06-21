'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AddToCartButton } from './add-to-cart-button'

const c = {
  terra:    '#C4654A',
  terraBg:  'rgba(196,101,74,0.08)',
  terraBord:'rgba(196,101,74,0.20)',
  saffron:  '#E8A838',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
} as const

function formatIQD(n: number) {
  return new Intl.NumberFormat('en-IQ').format(n) + ' IQD'
}

function useCountdown(endsAt: string) {
  const calc = () => {
    const diff = Math.max(0, new Date(endsAt).getTime() - Date.now())
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    return { h, m, s, expired: diff === 0 }
  }
  const [t, setT] = useState(calc)
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000)
    return () => clearInterval(id)
  }, [endsAt])
  return t
}

type Sale = {
  id: string
  sale_price: number
  quantity: number | null
  ends_at: string
  is_active: boolean
  bazaar_products: {
    id: string
    name_en: string
    name_ku: string | null
    name_ar: string | null
    shop_id: string
    unit: string
    image_url: string | null
    price?: number
    bazaar_shops: { name: string; slug: string }
  } | null
  bazaar_product_variants: { amount: number; unit: string } | null
}

function SaleCard({ sale }: { sale: Sale }) {
  const p = sale.bazaar_products
  if (!p) return null
  const { h, m, s, expired } = useCountdown(sale.ends_at)
  if (expired) return null

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div
      className="flex-shrink-0 w-[200px] rounded-[14px] overflow-hidden"
      style={{ background: c.white, border: `1px solid ${c.terraBord}` }}
    >
      <Link href={`/s/${p.bazaar_shops.slug}`} className="no-underline block">
        <div className="relative h-[110px]" style={{ background: c.terraBg }}>
          {p.image_url ? (
            <img src={p.image_url} alt={p.name_en} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-[family-name:var(--font-dm-sans)] text-[32px] font-medium" style={{ color: c.terraBord }}>
                {p.name_en.charAt(0)}
              </span>
            </div>
          )}
          {/* Countdown badge */}
          <div
            className="absolute top-2 right-2 px-2 py-1 rounded-[6px] font-[family-name:var(--font-dm-mono)] text-[10px] font-medium"
            style={{ background: c.terra, color: '#fff' }}
          >
            {h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`}
          </div>
        </div>
        <div className="p-3">
          <div className="font-[family-name:var(--font-dm-sans)] text-[12px] font-medium truncate mb-0.5" style={{ color: c.charcoal }}>
            {p.name_en}
          </div>
          <div className="font-[family-name:var(--font-dm-mono)] text-[10px] truncate mb-1" style={{ color: c.stone }}>
            {p.bazaar_shops.name}
          </div>
          {(sale.bazaar_product_variants?.amount || sale.quantity) && (
            <div className="font-[family-name:var(--font-dm-mono)] text-[10px] mb-2 font-medium" style={{ color: c.terra }}>
              {sale.bazaar_product_variants
                ? `${sale.bazaar_product_variants.amount} ${sale.bazaar_product_variants.unit}`
                : `${sale.quantity} ${p.unit}`}
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <span className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ color: c.terra }}>
                {formatIQD(sale.sale_price)}
              </span>
            </div>
            <AddToCartButton
              productId={p.id}
              shopId={p.shop_id}
              shopName={p.bazaar_shops.name}
              shopSlug={p.bazaar_shops.slug}
              name={p.name_en}
              price={p.price ?? sale.sale_price}
              salePrice={sale.sale_price}
              unit={p.unit}
              imageUrl={p.image_url}
            />
          </div>
        </div>
      </Link>
    </div>
  )
}

export function FlashSalesStrip({ sales }: { sales: Sale[] }) {
  if (!sales.length) return null

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="px-2 py-1 rounded-[6px] font-[family-name:var(--font-dm-mono)] text-[10px] font-medium"
          style={{ background: c.terra, color: '#fff' }}
        >
          FLASH SALES
        </div>
        <span className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.stone }}>
          Limited time deals — grab them before they end
        </span>
      </div>
      <div
        className="flex gap-3 overflow-x-auto pb-3"
        style={{ scrollbarWidth: 'none' }}
      >
        {sales.map(sale => (
          <SaleCard key={sale.id} sale={sale} />
        ))}
      </div>
    </div>
  )
}
