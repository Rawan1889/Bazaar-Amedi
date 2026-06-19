'use client'

import { useState, useTransition } from 'react'
import { createFlashSale, endFlashSale } from '@/lib/bazaar/flash-sale-actions'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  terra:    '#C4654A',
  terraBg:  'rgba(196,101,74,0.08)',
  saffron:  '#E8A838',
  saffronBg:'rgba(232,168,56,0.08)',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
  error:    '#C94A3A',
  errorBg:  'rgba(201,74,58,0.08)',
} as const

function formatIQD(amount: number) {
  return new Intl.NumberFormat('en-IQ').format(amount) + ' IQD'
}

interface FlashSale {
  id: string
  product_id: string
  sale_price: number
  starts_at: string
  ends_at: string
  is_active: boolean
  bazaar_products: { name_en: string; price: number }
}

interface Product {
  id: string
  name_en: string
  price: number
}

function SaleCard({ sale }: { sale: FlashSale }) {
  const [isPending, startTransition] = useTransition()
  const isExpired = new Date(sale.ends_at) < new Date()
  const isLive = sale.is_active && !isExpired
  const discount = Math.round((1 - sale.sale_price / sale.bazaar_products.price) * 100)

  return (
    <div className="rounded-[14px] p-5" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: c.charcoal }}>
            {sale.bazaar_products.name_en}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-[family-name:var(--font-dm-sans)] text-[13px] line-through" style={{ color: c.stone }}>
              {formatIQD(sale.bazaar_products.price)}
            </span>
            <span className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: c.terra }}>
              {formatIQD(sale.sale_price)}
            </span>
            <span
              className="px-1.5 py-0.5 rounded-[4px] font-[family-name:var(--font-dm-mono)] text-[9px] font-medium"
              style={{ background: c.terraBg, color: c.terra }}
            >
              -{discount}%
            </span>
          </div>
        </div>
        <span
          className="px-2 py-1 rounded-[6px] font-[family-name:var(--font-dm-mono)] text-[10px] font-medium"
          style={{
            background: isLive ? c.greenBg : c.terraBg,
            color: isLive ? c.green : c.terra,
          }}
        >
          {isLive ? 'Live' : isExpired ? 'Expired' : 'Ended'}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>
          Ends: {new Date(sale.ends_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </div>
        {isLive && (
          <button
            onClick={() => startTransition(() => { endFlashSale(sale.id) })}
            disabled={isPending}
            className="px-3 py-1.5 rounded-[6px] font-[family-name:var(--font-dm-sans)] text-[11px] border-none cursor-pointer"
            style={{ background: c.terraBg, color: c.terra, opacity: isPending ? 0.7 : 1 }}
          >
            {isPending ? 'Ending...' : 'End sale'}
          </button>
        )}
      </div>
    </div>
  )
}

function CreateSaleForm({ products, onDone }: { products: Product[]; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  return (
    <div className="rounded-[14px] p-5 mb-6" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-[family-name:var(--font-dm-sans)] text-[16px] font-medium" style={{ color: c.charcoal }}>
          New flash sale
        </h3>
        <button
          onClick={onDone}
          className="text-[12px] font-[family-name:var(--font-dm-sans)] border-none bg-transparent cursor-pointer"
          style={{ color: c.stone }}
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="rounded-[8px] px-3 py-2 mb-4 text-[12px] font-[family-name:var(--font-dm-sans)]" style={{ background: c.errorBg, color: c.error }}>
          {error}
        </div>
      )}

      {products.length === 0 ? (
        <p className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.stone }}>
          Add products first before creating flash sales.
        </p>
      ) : (
        <form
          className="flex flex-col gap-4"
          action={(formData: FormData) => {
            setError(null)
            startTransition(async () => {
              const result = await createFlashSale(formData)
              if (result?.error) setError(result.error)
              else onDone()
            })
          }}
        >
          <div className="flex flex-col gap-1">
            <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
              Product
            </label>
            <select
              name="product_id"
              required
              className="w-full rounded-[8px] px-3 py-2.5 text-[13px] font-[family-name:var(--font-dm-sans)] outline-none appearance-none cursor-pointer"
              style={{ border: `1px solid ${c.cream2}`, color: c.charcoal }}
              onChange={e => {
                const p = products.find(pr => pr.id === e.target.value)
                setSelectedProduct(p || null)
              }}
            >
              <option value="">Select product...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name_en} — {formatIQD(p.price)}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
              Sale price (IQD)
            </label>
            <input
              name="sale_price"
              type="number"
              required
              min="0"
              max={selectedProduct?.price || undefined}
              placeholder={selectedProduct ? `Less than ${selectedProduct.price}` : 'Sale price'}
              className="w-full rounded-[8px] px-3 py-2.5 text-[13px] font-[family-name:var(--font-dm-sans)] outline-none"
              style={{ border: `1px solid ${c.cream2}`, color: c.charcoal }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
              Sale ends
            </label>
            <input
              name="ends_at"
              type="datetime-local"
              required
              min={new Date().toISOString().slice(0, 16)}
              className="w-full rounded-[8px] px-3 py-2.5 text-[13px] font-[family-name:var(--font-dm-sans)] outline-none"
              style={{ border: `1px solid ${c.cream2}`, color: c.charcoal }}
            />
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onDone}
              className="px-4 py-2 rounded-[8px] font-[family-name:var(--font-dm-sans)] text-[13px] border-none bg-transparent cursor-pointer"
              style={{ color: c.stone }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 rounded-[8px] font-[family-name:var(--font-dm-sans)] text-[13px] font-medium border-none cursor-pointer"
              style={{ background: c.terra, color: '#fff', opacity: isPending ? 0.7 : 1 }}
            >
              {isPending ? 'Creating...' : 'Start flash sale'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export function FlashSaleManager({ sales, products }: { sales: FlashSale[]; products: Product[] }) {
  const [showForm, setShowForm] = useState(false)

  const activeSales = sales.filter(s => s.is_active && new Date(s.ends_at) > new Date())
  const pastSales = sales.filter(s => !s.is_active || new Date(s.ends_at) <= new Date())

  return (
    <div>
      {showForm ? (
        <CreateSaleForm products={products} onDone={() => setShowForm(false)} />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="mb-6 px-5 py-2.5 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[13px] font-medium border-none cursor-pointer transition-all duration-150"
          style={{ background: c.terra, color: '#fff' }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          + New flash sale
        </button>
      )}

      {activeSales.length > 0 && (
        <div className="mb-8">
          <h3 className="font-[family-name:var(--font-dm-sans)] text-[16px] font-medium mb-3" style={{ color: c.charcoal }}>
            Active sales
          </h3>
          <div className="flex flex-col gap-3">
            {activeSales.map(s => <SaleCard key={s.id} sale={s as FlashSale} />)}
          </div>
        </div>
      )}

      {pastSales.length > 0 && (
        <div>
          <h3 className="font-[family-name:var(--font-dm-sans)] text-[16px] font-medium mb-3" style={{ color: c.charcoal }}>
            Past sales
          </h3>
          <div className="flex flex-col gap-3">
            {pastSales.map(s => <SaleCard key={s.id} sale={s as FlashSale} />)}
          </div>
        </div>
      )}

      {sales.length === 0 && !showForm && (
        <div className="rounded-[14px] p-8 text-center" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: c.saffronBg }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c.saffron} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="font-[family-name:var(--font-dm-sans)] text-[16px] font-medium mb-1" style={{ color: c.charcoal }}>
            No flash sales yet
          </h3>
          <p className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.stone }}>
            Create limited-time deals to attract more customers.
          </p>
        </div>
      )}
    </div>
  )
}
