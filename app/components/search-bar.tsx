'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import Link from 'next/link'
import { searchProducts } from '@/lib/bazaar/search-actions'
import { AddToCartButton } from './add-to-cart-button'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  terra:    '#C4654A',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  bg:       '#FAFAF7',
  white:    '#FFFFFF',
} as const

function formatIQD(amount: number) {
  return new Intl.NumberFormat('en-IQ').format(amount) + ' IQD'
}

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Record<string, unknown>[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>(undefined)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSearch(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.trim().length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const data = await searchProducts(value)
        setResults(data)
        setIsOpen(true)
      })
    }, 300)
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-[480px]">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke={c.stone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Search products across all shops..."
          className="w-full pl-9 pr-4 py-2.5 rounded-[10px] text-[13px] font-[family-name:var(--font-dm-sans)] outline-none transition-all duration-150"
          style={{ background: c.cream, color: c.charcoal, border: `1px solid transparent` }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = c.cream2)}
          onMouseLeave={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = 'transparent' }}
        />
        {isPending && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${c.cream2}`, borderTopColor: 'transparent' }} />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-[12px] overflow-hidden shadow-lg z-30 max-h-[400px] overflow-y-auto"
          style={{ background: c.white, border: `1px solid ${c.cream2}` }}
        >
          <div className="px-4 py-2" style={{ borderBottom: `1px solid ${c.cream}` }}>
            <span className="font-[family-name:var(--font-dm-mono)] text-[10px] uppercase tracking-[0.1em]" style={{ color: c.stone }}>
              {results.length} result{results.length !== 1 ? 's' : ''}
            </span>
          </div>
          {results.map((r: Record<string, unknown>) => {
            const p = r as {
              id: string; name_en: string; price: number; unit: string; image_url: string | null; shop_id: string
              bazaar_shops: { name: string; slug: string }
              bazaar_flash_sales: { sale_price: number; ends_at: string; is_active: boolean }[] | null
              bazaar_product_variants: { id: string; stock_qty: number | null; price: number; in_stock: boolean }[] | null
            }
            const activeSale = p.bazaar_flash_sales?.find(s => s.is_active && new Date(s.ends_at) > new Date())
            const defaultVariant = p.bazaar_product_variants?.find(v => v.price === p.price) || p.bazaar_product_variants?.[0]

            return (
              <div
                key={p.id}
                className="flex items-center gap-3 px-4 py-3 transition-colors duration-100"
                style={{ borderBottom: `1px solid ${c.cream}` }}
                onMouseEnter={e => (e.currentTarget.style.background = c.cream)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div className="w-10 h-10 rounded-[8px] flex-shrink-0 overflow-hidden" style={{ background: c.cream }}>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name_en} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: c.cream2 }}>
                        {p.name_en.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <Link
                  href={`/s/${p.bazaar_shops.slug}`}
                  className="flex-1 min-w-0 no-underline"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium truncate" style={{ color: c.charcoal }}>
                    {p.name_en}
                  </div>
                  <div className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>
                    {p.bazaar_shops.name}
                  </div>
                </Link>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-[family-name:var(--font-dm-sans)] text-[12px] font-medium" style={{ color: activeSale ? c.terra : c.green }}>
                    {formatIQD(activeSale?.sale_price ?? p.price)}
                  </span>
                  <AddToCartButton
                    productId={p.id}
                    variantId={defaultVariant?.id}
                    shopId={p.shop_id}
                    shopName={p.bazaar_shops.name}
                    shopSlug={p.bazaar_shops.slug}
                    name={p.name_en}
                    price={p.price}
                    salePrice={activeSale?.sale_price ?? null}
                    unit={p.unit}
                    imageUrl={p.image_url}
                    stockQty={defaultVariant?.stock_qty}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {isOpen && query.trim().length >= 2 && results.length === 0 && !isPending && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-[12px] p-6 text-center shadow-lg z-30"
          style={{ background: c.white, border: `1px solid ${c.cream2}` }}
        >
          <p className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.stone }}>
            No products found for &ldquo;{query}&rdquo;
          </p>
        </div>
      )}
    </div>
  )
}
