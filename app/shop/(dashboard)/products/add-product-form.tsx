'use client'

import { useState, useTransition, useRef } from 'react'
import { addProduct } from '@/lib/bazaar/shop-actions'
import { uploadProductImage } from '@/lib/bazaar/image-upload'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
  error:    '#C94A3A',
  errorBg:  'rgba(201,74,58,0.08)',
} as const

const UNITS = [
  { value: 'piece', label: 'Piece' },
  { value: 'kg', label: 'kg' },
  { value: 'gram', label: 'gram' },
  { value: 'liter', label: 'Liter' },
  { value: 'ml', label: 'ml' },
  { value: 'pack', label: 'Pack' },
  { value: 'box', label: 'Box' },
  { value: 'bag', label: 'Bag' },
  { value: 'bundle', label: 'Bundle' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'can', label: 'Can' },
  { value: 'bottle', label: 'Bottle' },
]

type Variant = { id: number; amount: string; unit: string; price: string; stockQty: string }

let nextId = 1

function newVariant(): Variant {
  return { id: nextId++, amount: '', unit: 'piece', price: '', stockQty: '' }
}

export function AddProductForm({ categories }: { categories: { id: string; name_en: string }[] }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [variants, setVariants] = useState<Variant[]>([newVariant()])
  const fileRef = useRef<HTMLInputElement>(null)

  function addVariant() {
    setVariants(v => [...v, newVariant()])
  }

  function removeVariant(id: number) {
    setVariants(v => v.length > 1 ? v.filter(x => x.id !== id) : v)
  }

  function updateVariant(id: number, field: keyof Variant, value: string) {
    setVariants(v => v.map(x => x.id === id ? { ...x, [field]: value } : x))
  }

  function resetForm() {
    setOpen(false)
    setError(null)
    setImageUrl(null)
    setVariants([newVariant()])
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    const fd = new FormData()
    fd.append('file', file)
    const result = await uploadProductImage(fd)
    setUploading(false)
    if (result.error) setError(result.error)
    else if (result.url) setImageUrl(result.url)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mb-6 px-5 py-2.5 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[13px] font-medium border-none cursor-pointer transition-all duration-150"
        style={{ background: c.green, color: '#fff' }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(0.98)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        + Add product
      </button>
    )
  }

  return (
    <div className="rounded-[14px] p-5 mb-6" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-[family-name:var(--font-dm-sans)] text-[16px] font-medium" style={{ color: c.charcoal }}>
          New product
        </h3>
        <button onClick={resetForm} className="text-[12px] font-[family-name:var(--font-dm-sans)] border-none bg-transparent cursor-pointer" style={{ color: c.stone }}>
          Cancel
        </button>
      </div>

      {error && (
        <div className="rounded-[8px] px-3 py-2 mb-4 text-[12px] font-[family-name:var(--font-dm-sans)]" style={{ background: c.errorBg, color: c.error }}>
          {error}
        </div>
      )}

      <form
        className="flex flex-col gap-4"
        action={(formData: FormData) => {
          setError(null)
          if (imageUrl) formData.set('image_url', imageUrl)
          formData.set('variants', JSON.stringify(variants))
          startTransition(async () => {
            const result = await addProduct(formData)
            if (result?.error) setError(result.error)
            else resetForm()
          })
        }}
      >
        {/* Image + name row */}
        <div className="flex gap-4 items-start">
          <div>
            <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase mb-1 block" style={{ color: c.stone }}>
              Image
            </label>
            <input type="hidden" name="image_url" value={imageUrl || ''} />
            <div
              className="w-20 h-20 rounded-[10px] flex items-center justify-center overflow-hidden cursor-pointer flex-shrink-0"
              style={{ background: c.greenBg, border: `1px dashed ${c.cream2}` }}
              onClick={() => fileRef.current?.click()}
            >
              {imageUrl ? (
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : uploading ? (
                <span className="font-[family-name:var(--font-dm-mono)] text-[9px]" style={{ color: c.stone }}>Uploading…</span>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>

          <div className="flex-1 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>Product name</label>
              <input
                name="name_en" required placeholder="e.g. Fresh Tomatoes"
                className="w-full rounded-[8px] px-3 py-2.5 text-[13px] font-[family-name:var(--font-dm-sans)] outline-none"
                style={{ border: `1px solid ${c.cream2}`, color: c.charcoal }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>Category</label>
                <select
                  name="category_id"
                  className="w-full rounded-[8px] px-3 py-2.5 text-[13px] font-[family-name:var(--font-dm-sans)] outline-none appearance-none cursor-pointer"
                  style={{ border: `1px solid ${c.cream2}`, color: c.charcoal }}
                >
                  <option value="">None</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name_en}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>Description (optional)</label>
                <input
                  name="description" placeholder="Short description"
                  className="w-full rounded-[8px] px-3 py-2.5 text-[13px] font-[family-name:var(--font-dm-sans)] outline-none"
                  style={{ border: `1px solid ${c.cream2}`, color: c.charcoal }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing options */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
              Pricing options
            </label>
            <span className="font-[family-name:var(--font-dm-mono)] text-[9px]" style={{ color: c.stone }}>
              amount · unit · price · stock
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {variants.map((v, i) => (
              <div key={v.id} className="flex items-center gap-2 rounded-[8px] px-3 py-2.5" style={{ background: c.cream }}>
                {/* Amount */}
                <input
                  type="number" min="0" step="any"
                  value={v.amount}
                  onChange={e => updateVariant(v.id, 'amount', e.target.value)}
                  placeholder="1"
                  className="w-16 rounded-[6px] px-2 py-1.5 text-[12px] font-[family-name:var(--font-dm-sans)] outline-none text-center"
                  style={{ border: `1px solid ${c.cream2}`, color: c.charcoal, background: c.white }}
                />
                {/* Unit */}
                <select
                  value={v.unit}
                  onChange={e => updateVariant(v.id, 'unit', e.target.value)}
                  className="w-24 rounded-[6px] px-2 py-1.5 text-[12px] font-[family-name:var(--font-dm-sans)] outline-none appearance-none cursor-pointer"
                  style={{ border: `1px solid ${c.cream2}`, color: c.charcoal, background: c.white }}
                >
                  {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>

                <span className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>→</span>

                {/* Price */}
                <div className="flex items-center gap-1 flex-1">
                  <input
                    type="number" min="0"
                    value={v.price}
                    onChange={e => updateVariant(v.id, 'price', e.target.value)}
                    placeholder="2500"
                    className="w-full rounded-[6px] px-2 py-1.5 text-[12px] font-[family-name:var(--font-dm-sans)] outline-none"
                    style={{ border: `1px solid ${c.cream2}`, color: c.charcoal, background: c.white }}
                  />
                  <span className="font-[family-name:var(--font-dm-mono)] text-[9px] flex-shrink-0" style={{ color: c.stone }}>IQD</span>
                </div>

                {/* Stock qty */}
                <input
                  type="number" min="0"
                  value={v.stockQty}
                  onChange={e => updateVariant(v.id, 'stockQty', e.target.value)}
                  placeholder="stock"
                  className="w-16 rounded-[6px] px-2 py-1.5 text-[12px] font-[family-name:var(--font-dm-sans)] outline-none text-center"
                  style={{ border: `1px solid ${c.cream2}`, color: c.charcoal, background: c.white }}
                  title="Stock quantity (optional)"
                />

                {/* Remove */}
                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(v.id)}
                    className="w-6 h-6 flex items-center justify-center rounded-full border-none cursor-pointer flex-shrink-0 font-[family-name:var(--font-dm-sans)] text-[14px] leading-none"
                    style={{ background: 'rgba(201,74,58,0.1)', color: '#C94A3A' }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addVariant}
            className="mt-2 px-3 py-1.5 rounded-[6px] font-[family-name:var(--font-dm-sans)] text-[12px] border-none cursor-pointer"
            style={{ background: c.greenBg, color: c.green }}
          >
            + Add option
          </button>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button" onClick={resetForm}
            className="px-4 py-2 rounded-[8px] font-[family-name:var(--font-dm-sans)] text-[13px] border-none bg-transparent cursor-pointer"
            style={{ color: c.stone }}
          >
            Cancel
          </button>
          <button
            type="submit" disabled={isPending || uploading}
            className="px-5 py-2 rounded-[8px] font-[family-name:var(--font-dm-sans)] text-[13px] font-medium border-none cursor-pointer"
            style={{ background: c.green, color: '#fff', opacity: (isPending || uploading) ? 0.7 : 1 }}
          >
            {isPending ? 'Adding…' : 'Add product'}
          </button>
        </div>
      </form>
    </div>
  )
}
