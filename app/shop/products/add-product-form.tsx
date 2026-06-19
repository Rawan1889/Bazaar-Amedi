'use client'

import { useState, useTransition, useRef } from 'react'
import { addProduct } from '@/lib/bazaar/shop-actions'
import { uploadProductImage } from '@/lib/bazaar/image-upload'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
  error:    '#C94A3A',
  errorBg:  'rgba(201,74,58,0.08)',
} as const

export function AddProductForm({ categories }: { categories: { id: string; name_en: string }[] }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)
    const fd = new FormData()
    fd.append('file', file)
    const result = await uploadProductImage(fd)
    setUploading(false)

    if (result.error) {
      setError(result.error)
    } else if (result.url) {
      setImageUrl(result.url)
    }
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
    <div
      className="rounded-[14px] p-5 mb-6"
      style={{ background: c.white, border: `1px solid ${c.cream2}` }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-[family-name:var(--font-dm-sans)] text-[16px] font-medium" style={{ color: c.charcoal }}>
          New product
        </h3>
        <button
          onClick={() => { setOpen(false); setError(null); setImageUrl(null) }}
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

      <form
        className="grid grid-cols-2 gap-4"
        action={(formData: FormData) => {
          setError(null)
          if (imageUrl) formData.set('image_url', imageUrl)
          startTransition(async () => {
            const result = await addProduct(formData)
            if (result?.error) setError(result.error)
            else { setOpen(false); setImageUrl(null) }
          })
        }}
      >
        {/* Image upload */}
        <div className="col-span-2">
          <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase mb-1 block" style={{ color: c.stone }}>
            Product image
          </label>
          <input type="hidden" name="image_url" value={imageUrl || ''} />
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-[10px] flex items-center justify-center overflow-hidden cursor-pointer"
              style={{ background: c.greenBg, border: `1px dashed ${c.cream2}` }}
              onClick={() => fileRef.current?.click()}
            >
              {imageUrl ? (
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : uploading ? (
                <span className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>
                  Uploading...
                </span>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="px-3 py-1.5 rounded-[6px] font-[family-name:var(--font-dm-sans)] text-[12px] border-none cursor-pointer"
                style={{ background: c.greenBg, color: c.green }}
              >
                {uploading ? 'Uploading...' : imageUrl ? 'Change image' : 'Upload image'}
              </button>
              <div className="font-[family-name:var(--font-dm-mono)] text-[9px] mt-1" style={{ color: c.stone }}>
                Max 5MB, JPG/PNG
              </div>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        <div className="col-span-2 flex flex-col gap-1">
          <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
            Product name
          </label>
          <input
            name="name_en"
            required
            placeholder="e.g. Fresh Tomatoes"
            className="w-full rounded-[8px] px-3 py-2.5 text-[13px] font-[family-name:var(--font-dm-sans)] outline-none"
            style={{ border: `1px solid ${c.cream2}`, color: c.charcoal }}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
            Price (IQD)
          </label>
          <input
            name="price"
            type="number"
            required
            min="0"
            placeholder="2500"
            className="w-full rounded-[8px] px-3 py-2.5 text-[13px] font-[family-name:var(--font-dm-sans)] outline-none"
            style={{ border: `1px solid ${c.cream2}`, color: c.charcoal }}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
            Unit
          </label>
          <select
            name="unit"
            className="w-full rounded-[8px] px-3 py-2.5 text-[13px] font-[family-name:var(--font-dm-sans)] outline-none appearance-none cursor-pointer"
            style={{ border: `1px solid ${c.cream2}`, color: c.charcoal }}
          >
            <option value="piece">Piece</option>
            <option value="kg">Kilogram</option>
            <option value="gram">Gram</option>
            <option value="liter">Liter</option>
            <option value="pack">Pack</option>
            <option value="box">Box</option>
            <option value="dozen">Dozen</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
            Category
          </label>
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
          <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
            Description (optional)
          </label>
          <input
            name="description"
            placeholder="Short description"
            className="w-full rounded-[8px] px-3 py-2.5 text-[13px] font-[family-name:var(--font-dm-sans)] outline-none"
            style={{ border: `1px solid ${c.cream2}`, color: c.charcoal }}
          />
        </div>

        <div className="col-span-2 flex justify-end gap-3 mt-2">
          <button
            type="button"
            onClick={() => { setOpen(false); setError(null); setImageUrl(null) }}
            className="px-4 py-2 rounded-[8px] font-[family-name:var(--font-dm-sans)] text-[13px] border-none bg-transparent cursor-pointer"
            style={{ color: c.stone }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending || uploading}
            className="px-5 py-2 rounded-[8px] font-[family-name:var(--font-dm-sans)] text-[13px] font-medium border-none cursor-pointer"
            style={{ background: c.green, color: '#fff', opacity: (isPending || uploading) ? 0.7 : 1 }}
          >
            {isPending ? 'Adding...' : 'Add product'}
          </button>
        </div>
      </form>
    </div>
  )
}
