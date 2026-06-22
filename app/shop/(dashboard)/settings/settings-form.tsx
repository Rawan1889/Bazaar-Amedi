'use client'

import { useState, useTransition, useRef } from 'react'
import { updateShop, updateShopImages } from '@/lib/bazaar/shop-actions'
import { uploadShopImage } from '@/lib/bazaar/image-upload'

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

interface Shop {
  id: string
  name: string
  description: string | null
  phone: string | null
  address: string | null
  category_id: string | null
  is_open: boolean
  logo_url: string | null
  cover_url: string | null
}

function FormField({ name, label, defaultValue, placeholder, type = 'text' }: {
  name: string; label: string; defaultValue?: string | null; placeholder: string; type?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
        {label}
      </label>
      <input
        id={name} name={name} type={type} defaultValue={defaultValue || ''} placeholder={placeholder}
        className="w-full rounded-[10px] px-4 py-3 text-[14px] font-[family-name:var(--font-dm-sans)] outline-none transition-all duration-200"
        style={{ border: `1px solid ${c.cream2}`, color: c.charcoal, background: c.white }}
      />
    </div>
  )
}

function ImageUploadSlot({
  label, hint, currentUrl, aspectClass, onUploaded, type,
}: {
  label: string; hint: string; currentUrl: string | null; aspectClass: string; onUploaded: (url: string) => void; type: 'logo' | 'cover'
}) {
  const [preview, setPreview] = useState(currentUrl)
  const [uploading, setUploading] = useState(false)
  const [imgError, setImgError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setImgError(null)
    const fd = new FormData()
    fd.append('file', file)
    const result = await uploadShopImage(fd, type)
    setUploading(false)
    if (result.error) { setImgError(result.error); return }
    if (result.url) { setPreview(result.url); onUploaded(result.url) }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>{label}</label>
      <div
        className={`${aspectClass} rounded-[10px] overflow-hidden cursor-pointer relative group`}
        style={{ background: c.cream, border: `1px dashed ${c.cream2}` }}
        onClick={() => fileRef.current?.click()}
      >
        {preview ? (
          <>
            <img src={preview} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="font-[family-name:var(--font-dm-sans)] text-[12px] text-white">Change</span>
            </div>
          </>
        ) : uploading ? (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>Uploading…</span>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c.stone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-[family-name:var(--font-dm-sans)] text-[11px]" style={{ color: c.stone }}>{hint}</span>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      {imgError && <span className="text-[11px] font-[family-name:var(--font-dm-sans)]" style={{ color: c.error }}>{imgError}</span>}
    </div>
  )
}

export function ShopSettingsForm({ shop, categories }: {
  shop: Shop | null
  categories: { id: string; name_en: string }[]
}) {
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [logoUrl, setLogoUrl] = useState(shop?.logo_url ?? null)
  const [coverUrl, setCoverUrl] = useState(shop?.cover_url ?? null)

  function handleImageUploaded(type: 'logo' | 'cover', url: string) {
    if (type === 'logo') setLogoUrl(url)
    else setCoverUrl(url)
    startTransition(async () => {
      await updateShopImages(
        type === 'logo' ? url : logoUrl,
        type === 'cover' ? url : coverUrl,
      )
    })
  }

  return (
    <div className="max-w-[560px]">
      {error && (
        <div className="rounded-[10px] px-4 py-3 mb-4 text-[13px] font-[family-name:var(--font-dm-sans)]" style={{ background: c.errorBg, color: c.error }}>
          {error}
        </div>
      )}
      {saved && (
        <div className="rounded-[10px] px-4 py-3 mb-4 text-[13px] font-[family-name:var(--font-dm-sans)]" style={{ background: c.greenBg, color: c.green }}>
          Shop settings saved.
        </div>
      )}

      {/* Images section — saves immediately on upload */}
      <div className="rounded-[14px] p-6 mb-5" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
        <h3 className="font-[family-name:var(--font-dm-sans)] text-[16px] font-medium mb-5" style={{ color: c.charcoal }}>
          Shop images
        </h3>
        <div className="flex flex-col gap-4">
          <ImageUploadSlot
            label="Cover photo" hint="Recommended: 1200 × 400"
            currentUrl={shop?.cover_url ?? null}
            aspectClass="w-full h-32"
            type="cover"
            onUploaded={url => handleImageUploaded('cover', url)}
          />
          <ImageUploadSlot
            label="Logo" hint="Square, 400 × 400"
            currentUrl={shop?.logo_url ?? null}
            aspectClass="w-24 h-24"
            type="logo"
            onUploaded={url => handleImageUploaded('logo', url)}
          />
        </div>
      </div>

      <form
        className="flex flex-col gap-5"
        action={(formData: FormData) => {
          setError(null)
          setSaved(false)
          startTransition(async () => {
            const result = await updateShop(formData)
            if (result?.error) setError(result.error)
            else setSaved(true)
          })
        }}
      >
        <div className="rounded-[14px] p-6" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
          <h3 className="font-[family-name:var(--font-dm-sans)] text-[16px] font-medium mb-5" style={{ color: c.charcoal }}>
            Basic information
          </h3>

          <div className="flex flex-col gap-4">
            <FormField name="name" label="Shop name" defaultValue={shop?.name} placeholder="e.g. Ahmad's Grocery" />
            <FormField name="description" label="Description (optional)" defaultValue={shop?.description} placeholder="Tell customers about your shop" />
            <FormField name="phone" label="Phone number" defaultValue={shop?.phone} placeholder="+964 750 123 4567" type="tel" />
            <FormField name="address" label="Address" defaultValue={shop?.address} placeholder="Near Amedi bazaar, main street" />

            <div className="flex flex-col gap-1.5">
              <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
                Category
              </label>
              <select
                name="category_id" defaultValue={shop?.category_id || ''}
                className="w-full rounded-[10px] px-4 py-3 text-[14px] font-[family-name:var(--font-dm-sans)] outline-none appearance-none cursor-pointer"
                style={{ border: `1px solid ${c.cream2}`, color: c.charcoal, background: c.white }}
              >
                <option value="">Select category...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name_en}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-[14px] p-6" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
          <h3 className="font-[family-name:var(--font-dm-sans)] text-[16px] font-medium mb-4" style={{ color: c.charcoal }}>
            Availability
          </h3>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="hidden" name="is_open" value={shop?.is_open !== false ? 'true' : 'false'} />
            <div
              className="w-10 h-6 rounded-full relative cursor-pointer transition-all duration-200"
              style={{ background: shop?.is_open !== false ? c.green : c.cream2 }}
              onClick={e => {
                const hidden = e.currentTarget.previousElementSibling as HTMLInputElement
                const newVal = hidden.value === 'true' ? 'false' : 'true'
                hidden.value = newVal
                e.currentTarget.style.background = newVal === 'true' ? c.green : c.cream2
                const dot = e.currentTarget.firstElementChild as HTMLElement
                dot.style.transform = newVal === 'true' ? 'translateX(16px)' : 'translateX(0)'
              }}
            >
              <div
                className="w-5 h-5 rounded-full absolute top-0.5 left-0.5 transition-transform duration-200"
                style={{ background: '#fff', transform: shop?.is_open !== false ? 'translateX(16px)' : 'translateX(0)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
              />
            </div>
            <span className="font-[family-name:var(--font-dm-sans)] text-[14px]" style={{ color: c.charcoal }}>
              Shop is open for orders
            </span>
          </label>
        </div>

        <button
          type="submit" disabled={isPending}
          className="w-full py-3.5 rounded-[10px] text-[14px] font-medium font-[family-name:var(--font-dm-sans)] cursor-pointer border-none transition-all duration-200"
          style={{ background: c.green, color: '#fff', opacity: isPending ? 0.7 : 1 }}
          onMouseEnter={e => !isPending && (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {isPending ? 'Saving...' : 'Save settings'}
        </button>
      </form>
    </div>
  )
}
