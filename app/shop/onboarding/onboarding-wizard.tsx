'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { updateShop, addProduct } from '@/lib/bazaar/shop-actions'
import { updateOnboardingStep, completeOnboarding } from '@/lib/bazaar/onboarding-actions'
import { uploadProductImage } from '@/lib/bazaar/image-upload'

const c = {
  green:      '#2D8A5E',
  greenHover: '#247A51',
  greenBg:    'rgba(45,138,94,0.08)',
  greenBord:  'rgba(45,138,94,0.2)',
  terra:      '#C4654A',
  saffron:    '#E8A838',
  saffronBg:  'rgba(232,168,56,0.08)',
  charcoal:   '#1E1C19',
  stone:      '#7A756E',
  stoneLight: '#9A958E',
  cream:      '#F2EFEA',
  cream2:     '#E8E4DE',
  bg:         '#FAFAF7',
  white:      '#FFFFFF',
  error:      '#C94A3A',
  errorBg:    'rgba(201,74,58,0.08)',
} as const

interface Shop {
  id: string
  name: string
  slug: string
  description: string | null
  phone: string | null
  address: string | null
  category_id: string | null
  neighborhood: string | null
  zone_id: string | null
  is_open: boolean
  is_approved: boolean
}

interface Zone {
  id: string
  name: string
  fee: number
}

interface Product {
  id: string
  name_en: string
  price: number
  unit: string
  in_stock: boolean
}

const steps = [
  { label: 'Shop details', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { label: 'Add products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { label: 'Preview', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
  { label: 'Go live', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3' },
]

function FormField({ name, label, defaultValue, placeholder, type = 'text', required = false }: {
  name: string; label: string; defaultValue?: string | null; placeholder: string; type?: string; required?: boolean
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
        {label}{required && <span style={{ color: c.terra }}> *</span>}
      </label>
      <input
        id={name} name={name} type={type} defaultValue={defaultValue || ''} placeholder={placeholder} required={required}
        className="w-full rounded-[10px] px-4 py-3 text-[14px] font-[family-name:var(--font-dm-sans)] outline-none transition-all duration-200"
        style={{ border: `1px solid ${focused ? c.green : c.cream2}`, color: c.charcoal, background: c.white, boxShadow: focused ? `0 0 0 3px ${c.greenBg}` : 'none' }}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      />
    </div>
  )
}

export function OnboardingWizard({ shop, categories, products, zones, currentStep }: {
  shop: Shop | null
  categories: { id: string; name_en: string }[]
  products: Product[]
  zones: Zone[]
  currentStep: number
}) {
  const [step, setStep] = useState(currentStep)
  const [error, setError] = useState<string | null>(null)
  const [productError, setProductError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [localProducts, setLocalProducts] = useState<Product[]>(products)
  const [productAdded, setProductAdded] = useState(false)
  const [productImage, setProductImage] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const productImageInput = useRef<HTMLInputElement>(null)

  async function handleProductImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    setProductError(null)
    const fd = new FormData()
    fd.append('file', file)
    const result = await uploadProductImage(fd)
    setUploadingImage(false)
    if (result.error) setProductError(result.error)
    else if (result.url) setProductImage(result.url)
  }
  const router = useRouter()

  function goToStep(newStep: number) {
    setStep(newStep)
    setError(null)
    updateOnboardingStep(newStep)
  }

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: c.bg }}>
      {/* Header */}
      <div className="px-6 pt-8 pb-6 text-center">
        <a href="/" className="inline-block no-underline mb-4">
          <span className="font-[family-name:var(--font-dm-sans)] text-[22px] font-medium" style={{ color: c.charcoal }}>
            bazaar<span style={{ color: c.green }}>.</span>
          </span>
        </a>
        <h1 className="font-[family-name:var(--font-dm-sans)] text-[24px] font-medium mb-1" style={{ color: c.charcoal }}>
          Set up your shop
        </h1>
        <p className="font-[family-name:var(--font-dm-sans)] text-[14px]" style={{ color: c.stone }}>
          {step === 0 && 'Tell customers about your market'}
          {step === 1 && 'List your first products'}
          {step === 2 && 'See how your shop looks'}
          {step === 3 && 'You\'re ready to start selling'}
        </p>
      </div>

      {/* Progress steps */}
      <div className="px-6 mb-8">
        <div className="max-w-[560px] mx-auto flex items-center gap-1">
          {steps.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex items-center">
                {i > 0 && <div className="flex-1 h-[2px] rounded-full" style={{ background: i <= step ? c.green : c.cream2 }} />}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                  style={{
                    background: i < step ? c.green : i === step ? c.greenBg : c.cream,
                    border: i === step ? `2px solid ${c.green}` : '2px solid transparent',
                  }}
                >
                  {i < step ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={i === step ? c.green : c.stone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d={s.icon} />
                    </svg>
                  )}
                </div>
                {i < steps.length - 1 && <div className="flex-1 h-[2px] rounded-full" style={{ background: i < step ? c.green : c.cream2 }} />}
              </div>
              <span
                className="font-[family-name:var(--font-dm-mono)] text-[9px] tracking-[0.05em] uppercase"
                style={{ color: i <= step ? c.green : c.stoneLight }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 px-6 pb-8">
        <div className="max-w-[560px] mx-auto">
          {error && (
            <div className="rounded-[10px] px-4 py-3 mb-4 text-[13px] font-[family-name:var(--font-dm-sans)]" style={{ background: c.errorBg, color: c.error }}>
              {error}
            </div>
          )}

          {/* Step 0: Shop details */}
          {step === 0 && (
            <form
              className="flex flex-col gap-5"
              action={(formData: FormData) => {
                setError(null)
                startTransition(async () => {
                  const result = await updateShop(formData)
                  if (result?.error) setError(result.error)
                  else goToStep(1)
                })
              }}
            >
              <div className="rounded-[14px] p-6" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
                <div className="flex flex-col gap-4">
                  <FormField name="name" label="Shop name" defaultValue={shop?.name} placeholder="e.g. Ahmad's Grocery" required />
                  <FormField name="description" label="Description" defaultValue={shop?.description} placeholder="Tell customers what you sell — fresh produce, spices, household goods..." />
                  <FormField name="phone" label="Phone" defaultValue={shop?.phone} placeholder="+964 750 123 4567" type="tel" required />
                  <FormField name="address" label="Address" defaultValue={shop?.address} placeholder="Near Amedi bazaar, main street" required />
                  <FormField name="neighborhood" label="Neighborhood" defaultValue={shop?.neighborhood} placeholder="e.g. Sulava, Qadishaye" />

                  {zones.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
                        Delivery zone
                      </label>
                      <select
                        name="zone_id" defaultValue={shop?.zone_id || ''}
                        className="w-full rounded-[10px] px-4 py-3 text-[14px] font-[family-name:var(--font-dm-sans)] outline-none appearance-none cursor-pointer"
                        style={{ border: `1px solid ${c.cream2}`, color: c.charcoal, background: c.white }}
                      >
                        <option value="">Select zone...</option>
                        {zones.map(z => (
                          <option key={z.id} value={z.id}>{z.name} — {z.fee.toLocaleString()} IQD</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
                      Category<span style={{ color: c.terra }}> *</span>
                    </label>
                    <select
                      name="category_id" required defaultValue={shop?.category_id || ''}
                      className="w-full rounded-[10px] px-4 py-3 text-[14px] font-[family-name:var(--font-dm-sans)] outline-none appearance-none cursor-pointer"
                      style={{ border: `1px solid ${c.cream2}`, color: c.charcoal, background: c.white }}
                    >
                      <option value="">Select category...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name_en}</option>
                      ))}
                    </select>
                  </div>

                  <input type="hidden" name="is_open" value="false" />
                </div>
              </div>

              <button
                type="submit" disabled={isPending}
                className="w-full py-3.5 rounded-[10px] text-[14px] font-medium font-[family-name:var(--font-dm-sans)] cursor-pointer border-none transition-all duration-200"
                style={{ background: c.green, color: '#fff', opacity: isPending ? 0.7 : 1 }}
              >
                {isPending ? 'Saving...' : 'Save & continue'}
              </button>
            </form>
          )}

          {/* Step 1: Add products */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              {localProducts.length > 0 && (
                <div className="rounded-[14px] overflow-hidden" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
                  <div className="px-5 py-3" style={{ borderBottom: `1px solid ${c.cream}` }}>
                    <span className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
                      Your products ({localProducts.length})
                    </span>
                  </div>
                  {localProducts.map(p => (
                    <div key={p.id} className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${c.cream}` }}>
                      <div>
                        <span className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ color: c.charcoal }}>{p.name_en}</span>
                        <span className="font-[family-name:var(--font-dm-mono)] text-[11px] ml-2" style={{ color: c.stone }}>{p.unit}</span>
                      </div>
                      <span className="font-[family-name:var(--font-dm-mono)] text-[13px] font-medium" style={{ color: c.green }}>
                        {p.price.toLocaleString()} IQD
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {productAdded && (
                <div className="rounded-[10px] px-4 py-3 text-[13px] font-[family-name:var(--font-dm-sans)]" style={{ background: c.greenBg, color: c.green }}>
                  Product added! Add more or continue to the next step.
                </div>
              )}

              <form
                className="rounded-[14px] p-6" style={{ background: c.white, border: `1px solid ${c.cream2}` }}
                action={(formData: FormData) => {
                  setProductError(null)
                  setProductAdded(false)
                  // Build variants JSON from simple price/unit/quantity fields
                  const price = formData.get('price') as string
                  const unit = (formData.get('unit') as string) || 'piece'
                  const stockQty = (formData.get('quantity') as string) || ''
                  formData.set('variants', JSON.stringify([{ amount: '1', unit, price, stockQty }]))
                  if (productImage) formData.set('image_url', productImage)
                  startTransition(async () => {
                    const result = await addProduct(formData)
                    if (result?.error) { setProductError(result.error); return }
                    setLocalProducts(prev => [{
                      id: crypto.randomUUID(),
                      name_en: formData.get('name_en') as string,
                      price: parseInt(price),
                      unit,
                      in_stock: true,
                    }, ...prev])
                    setProductAdded(true)
                    setProductImage(null)
                    const form = document.querySelector('form[data-product-form]') as HTMLFormElement
                    form?.reset()
                  })
                }}
                data-product-form
              >
                <h3 className="font-[family-name:var(--font-dm-sans)] text-[15px] font-medium mb-4" style={{ color: c.charcoal }}>
                  Add a product
                </h3>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
                      Product photo
                    </label>
                    <div
                      className="w-24 h-24 rounded-[10px] overflow-hidden cursor-pointer flex items-center justify-center flex-shrink-0"
                      style={{ background: c.greenBg, border: `1px dashed ${c.cream2}` }}
                      onClick={() => productImageInput.current?.click()}
                    >
                      {productImage ? (
                        <img src={productImage} alt="Product preview" className="w-full h-full object-cover" />
                      ) : uploadingImage ? (
                        <span className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>Uploading…</span>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <input ref={productImageInput} type="file" accept="image/*" className="hidden" onChange={handleProductImage} />
                  </div>

                  <FormField name="name_en" label="Product name" placeholder="e.g. Fresh tomatoes" required />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField name="price" label="Price (IQD)" placeholder="2500" type="number" required />
                    <div className="flex flex-col gap-1.5">
                      <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>Unit</label>
                      <select
                        name="unit" defaultValue="piece"
                        className="w-full rounded-[10px] px-4 py-3 text-[14px] font-[family-name:var(--font-dm-sans)] outline-none appearance-none cursor-pointer"
                        style={{ border: `1px solid ${c.cream2}`, color: c.charcoal, background: c.white }}
                      >
                        <option value="piece">Piece</option>
                        <option value="kg">Kilogram (kg)</option>
                        <option value="gram">Gram (g)</option>
                        <option value="liter">Liter (L)</option>
                        <option value="ml">Milliliter (ml)</option>
                        <option value="pack">Pack</option>
                        <option value="box">Box</option>
                        <option value="bag">Bag</option>
                        <option value="bundle">Bundle</option>
                        <option value="dozen">Dozen</option>
                        <option value="can">Can</option>
                        <option value="bottle">Bottle</option>
                      </select>
                    </div>
                  </div>
                  <FormField name="quantity" label="Quantity in stock" placeholder="e.g. 50" type="number" />
                  <FormField name="description" label="Description (optional)" placeholder="Brief description..." />

                  {categories.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>Category</label>
                      <select
                        name="category_id"
                        className="w-full rounded-[10px] px-4 py-3 text-[14px] font-[family-name:var(--font-dm-sans)] outline-none appearance-none cursor-pointer"
                        style={{ border: `1px solid ${c.cream2}`, color: c.charcoal, background: c.white }}
                      >
                        <option value="">Select...</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name_en}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {productError && (
                    <div className="rounded-[8px] px-3 py-2.5 text-[13px] font-[family-name:var(--font-dm-sans)]" style={{ background: c.errorBg, color: c.error }}>
                      {productError}
                    </div>
                  )}

                  <button
                    type="submit" disabled={isPending}
                    className="w-full py-3 rounded-[10px] text-[13px] font-medium font-[family-name:var(--font-dm-sans)] cursor-pointer border-none transition-all duration-200"
                    style={{ background: c.greenBg, color: c.green, border: `1px solid ${c.greenBord}`, opacity: isPending ? 0.7 : 1 }}
                  >
                    {isPending ? 'Adding...' : '+ Add product'}
                  </button>
                </div>
              </form>

              <div className="flex gap-3">
                <button
                  onClick={() => goToStep(0)}
                  className="flex-1 py-3.5 rounded-[10px] text-[14px] font-medium font-[family-name:var(--font-dm-sans)] cursor-pointer border-none"
                  style={{ background: c.cream, color: c.stone }}
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    if (localProducts.length === 0) { setError('Add at least one product before continuing.'); return }
                    goToStep(2)
                  }}
                  className="flex-[2] py-3.5 rounded-[10px] text-[14px] font-medium font-[family-name:var(--font-dm-sans)] cursor-pointer border-none transition-all duration-200"
                  style={{ background: c.green, color: '#fff' }}
                >
                  Continue ({localProducts.length} product{localProducts.length !== 1 ? 's' : ''})
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div className="rounded-[14px] overflow-hidden" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
                {/* Shop header preview */}
                <div className="p-6" style={{ background: c.greenBg }}>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-[12px] flex items-center justify-center" style={{ background: c.green }}>
                      <span className="font-[family-name:var(--font-dm-sans)] text-[24px] font-medium" style={{ color: '#fff' }}>
                        {shop?.name?.[0]?.toUpperCase() || 'S'}
                      </span>
                    </div>
                    <div>
                      <div className="font-[family-name:var(--font-dm-sans)] text-[18px] font-medium" style={{ color: c.charcoal }}>
                        {shop?.name || 'Your Shop'}
                      </div>
                      {shop?.description && (
                        <div className="font-[family-name:var(--font-dm-sans)] text-[13px] mt-0.5" style={{ color: c.stone }}>
                          {shop.description}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        {shop?.address && (
                          <span className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>
                            {shop.address}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Products preview */}
                <div className="p-5">
                  <div className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase mb-3" style={{ color: c.stone }}>
                    Products preview
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {localProducts.slice(0, 4).map(p => (
                      <div key={p.id} className="rounded-[10px] p-3" style={{ background: c.cream }}>
                        <div className="w-full aspect-square rounded-[8px] mb-2 flex items-center justify-center" style={{ background: c.cream2 }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c.stoneLight} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <div className="font-[family-name:var(--font-dm-sans)] text-[12px] font-medium truncate" style={{ color: c.charcoal }}>
                          {p.name_en}
                        </div>
                        <div className="font-[family-name:var(--font-dm-mono)] text-[11px]" style={{ color: c.green }}>
                          {p.price.toLocaleString()} IQD
                        </div>
                      </div>
                    ))}
                  </div>
                  {localProducts.length > 4 && (
                    <div className="text-center mt-3">
                      <span className="font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ color: c.stone }}>
                        +{localProducts.length - 4} more product{localProducts.length - 4 !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {!shop?.is_approved && (
                <div className="rounded-[14px] p-4" style={{ background: c.saffronBg, border: '1px solid rgba(232,168,56,0.2)' }}>
                  <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.saffron} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ color: c.charcoal }}>
                      Your shop will be visible to customers after admin approval. You can keep adding products while waiting.
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => goToStep(1)}
                  className="flex-1 py-3.5 rounded-[10px] text-[14px] font-medium font-[family-name:var(--font-dm-sans)] cursor-pointer border-none"
                  style={{ background: c.cream, color: c.stone }}
                >
                  Back
                </button>
                <button
                  onClick={() => goToStep(3)}
                  className="flex-[2] py-3.5 rounded-[10px] text-[14px] font-medium font-[family-name:var(--font-dm-sans)] cursor-pointer border-none transition-all duration-200"
                  style={{ background: c.green, color: '#fff' }}
                >
                  Looks good!
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Go live */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div className="rounded-[14px] p-8 text-center" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: c.greenBg }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={c.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3" />
                  </svg>
                </div>
                <h2 className="font-[family-name:var(--font-dm-sans)] text-[22px] font-medium mb-2" style={{ color: c.charcoal }}>
                  You&apos;re all set!
                </h2>
                <p className="font-[family-name:var(--font-dm-sans)] text-[14px] mb-6 max-w-[380px] mx-auto" style={{ color: c.stone }}>
                  Your shop <strong style={{ color: c.charcoal }}>{shop?.name}</strong> has{' '}
                  {localProducts.length} product{localProducts.length !== 1 ? 's' : ''} ready.
                  {shop?.is_approved
                    ? ' Customers can now find and order from your shop.'
                    : ' Once approved by our team, customers will be able to order.'}
                </p>

                <div className="flex flex-col gap-3 max-w-[320px] mx-auto">
                  <div className="flex items-center gap-3 text-left p-3 rounded-[10px]" style={{ background: c.cream }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.charcoal }}>Shop details completed</span>
                  </div>
                  <div className="flex items-center gap-3 text-left p-3 rounded-[10px]" style={{ background: c.cream }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.charcoal }}>{localProducts.length} product{localProducts.length !== 1 ? 's' : ''} added</span>
                  </div>
                  <div className="flex items-center gap-3 text-left p-3 rounded-[10px]" style={{ background: shop?.is_approved ? c.cream : c.saffronBg }}>
                    {shop?.is_approved ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.saffron} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    <span className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.charcoal }}>
                      {shop?.is_approved ? 'Shop approved' : 'Pending admin approval'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => goToStep(2)}
                  className="flex-1 py-3.5 rounded-[10px] text-[14px] font-medium font-[family-name:var(--font-dm-sans)] cursor-pointer border-none"
                  style={{ background: c.cream, color: c.stone }}
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    startTransition(async () => {
                      await completeOnboarding()
                      router.push('/shop')
                    })
                  }}
                  disabled={isPending}
                  className="flex-[2] py-3.5 rounded-[10px] text-[14px] font-medium font-[family-name:var(--font-dm-sans)] cursor-pointer border-none transition-all duration-200"
                  style={{ background: c.green, color: '#fff', opacity: isPending ? 0.7 : 1 }}
                >
                  {isPending ? 'Finishing...' : 'Go to my dashboard'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
