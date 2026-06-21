'use client'

import { useTransition } from 'react'
import { deleteProduct, toggleProductStock } from '@/lib/bazaar/shop-actions'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  terra:    '#C4654A',
  terraBg:  'rgba(196,101,74,0.08)',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
} as const

interface Product {
  id: string
  name_en: string
  price: number
  unit: string
  in_stock: boolean
  description: string | null
  bazaar_categories: { name_en: string } | null
}

function formatIQD(amount: number) {
  return new Intl.NumberFormat('en-IQ').format(amount) + ' IQD'
}

function ProductRow({ product }: { product: Product }) {
  const [isPending, startTransition] = useTransition()

  return (
    <div
      className="flex items-center gap-4 px-5 py-4 transition-all duration-100"
      style={{
        borderBottom: `1px solid ${c.cream2}`,
        opacity: isPending ? 0.5 : 1,
      }}
    >
      <div
        className="w-10 h-10 rounded-[8px] flex items-center justify-center flex-shrink-0 font-[family-name:var(--font-dm-sans)] text-[14px] font-medium"
        style={{
          background: product.in_stock ? c.greenBg : c.terraBg,
          color: product.in_stock ? c.green : c.terra,
        }}
      >
        {product.name_en.charAt(0)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium truncate" style={{ color: c.charcoal }}>
          {product.name_en}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {product.bazaar_categories && (
            <span className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>
              {product.bazaar_categories.name_en}
            </span>
          )}
          {product.description && (
            <span className="font-[family-name:var(--font-dm-sans)] text-[11px] truncate" style={{ color: c.stone }}>
              {product.description}
            </span>
          )}
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <div className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: c.charcoal }}>
          {formatIQD(product.price)}
        </div>
        <div className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>
          per {product.unit}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <form action={(fd: FormData) => { startTransition(() => { toggleProductStock(fd) }) }}>
          <input type="hidden" name="product_id" value={product.id} />
          <input type="hidden" name="in_stock" value={product.in_stock.toString()} />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-[6px] font-[family-name:var(--font-dm-mono)] text-[10px] border-none cursor-pointer"
            style={{
              background: product.in_stock ? c.greenBg : c.terraBg,
              color: product.in_stock ? c.green : c.terra,
            }}
          >
            {product.in_stock ? 'In stock' : 'Out'}
          </button>
        </form>

        <form action={(fd: FormData) => {
          if (confirm('Delete this product?')) {
            startTransition(() => { deleteProduct(fd) })
          }
        }}>
          <input type="hidden" name="product_id" value={product.id} />
          <button
            type="submit"
            className="px-2 py-1.5 rounded-[6px] font-[family-name:var(--font-dm-sans)] text-[10px] border-none cursor-pointer bg-transparent"
            style={{ color: c.stone }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}

export function ProductList({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div
        className="rounded-[14px] p-8 text-center"
        style={{ background: c.white, border: `1px solid ${c.cream2}` }}
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: c.greenBg }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="font-[family-name:var(--font-dm-sans)] text-[16px] font-medium mb-1" style={{ color: c.charcoal }}>
          No products yet
        </h3>
        <p className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.stone }}>
          Add your first product to start selling on Bazaar Amedi.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-[14px] overflow-hidden" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
      {products.map(product => (
        <ProductRow key={product.id} product={product} />
      ))}
    </div>
  )
}
