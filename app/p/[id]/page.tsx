export const dynamic = 'force-dynamic'
import { createBazaarServer } from '@/lib/bazaar/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ProductGallery } from '@/app/components/product-gallery'
import { AddToCartButton } from '@/app/components/add-to-cart-button'
import { CartBar } from '@/app/components/cart-bar'
import { CustomerNav } from '@/app/components/customer-nav'
import { LocalizedName } from '@/app/components/localized-name'

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

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createBazaarServer()

  const { data: product } = await supabase
    .from('bazaar_products')
    .select('*, bazaar_shops!inner(id, name, slug, is_approved), bazaar_product_variants(id, amount, unit, price, in_stock), bazaar_product_images(url, sort_order), bazaar_flash_sales(sale_price, ends_at, is_active)')
    .eq('id', id)
    .single()

  if (!product) notFound()

  const p = product as {
    id: string; shop_id: string; name_en: string; name_ku: string | null; name_ar: string | null
    description: string | null; price: number; unit: string; image_url: string | null; in_stock: boolean
    bazaar_shops: { id: string; name: string; slug: string; is_approved: boolean }
    bazaar_product_variants: { id: string; amount: number; unit: string; price: number; in_stock: boolean }[]
    bazaar_product_images: { url: string; sort_order: number }[]
    bazaar_flash_sales: { sale_price: number; ends_at: string; is_active: boolean }[] | null
  }

  if (!p.bazaar_shops.is_approved) notFound()

  const gallery = [
    ...(p.image_url ? [p.image_url] : []),
    ...(p.bazaar_product_images || []).sort((a, b) => a.sort_order - b.sort_order).map(i => i.url),
  ]

  const activeSale = p.bazaar_flash_sales?.find(s => s.is_active && new Date(s.ends_at) > new Date())
  const variants = (p.bazaar_product_variants || []).sort((a, b) => a.price - b.price)
  const basePrice = variants[0]?.price ?? p.price

  return (
    <div className="min-h-[100dvh] pb-20 md:pb-0" style={{ background: c.bg }}>
      <CustomerNav />

      <div className="max-w-[900px] mx-auto px-6 py-8">
        <Link href={`/s/${p.bazaar_shops.slug}`} className="inline-flex items-center gap-1.5 mb-5 no-underline font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.stone }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          {p.bazaar_shops.name}
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ProductGallery images={gallery} alt={p.name_en} />

          <div>
            <LocalizedName
              en={p.name_en} ku={p.name_ku} ar={p.name_ar}
              className="font-[family-name:var(--font-dm-sans)] text-[26px] font-medium"
              style={{ color: c.charcoal }}
            />

            <div className="flex items-center gap-3 mt-3">
              {activeSale ? (
                <>
                  <span className="font-[family-name:var(--font-dm-sans)] text-[22px] font-medium" style={{ color: c.terra }}>
                    {formatIQD(activeSale.sale_price)}
                  </span>
                  <span className="font-[family-name:var(--font-dm-sans)] text-[15px] line-through" style={{ color: c.stone }}>
                    {formatIQD(basePrice)}
                  </span>
                </>
              ) : (
                <span className="font-[family-name:var(--font-dm-sans)] text-[22px] font-medium" style={{ color: c.green }}>
                  {formatIQD(basePrice)}
                </span>
              )}
              <span className="font-[family-name:var(--font-dm-mono)] text-[11px]" style={{ color: c.stone }}>per {p.unit}</span>
            </div>

            {p.description && (
              <p className="font-[family-name:var(--font-dm-sans)] text-[14px] leading-relaxed mt-4" style={{ color: c.stone }}>
                {p.description}
              </p>
            )}

            {variants.length > 1 && (
              <div className="mt-5">
                <div className="font-[family-name:var(--font-dm-mono)] text-[10px] uppercase tracking-[0.1em] mb-2" style={{ color: c.stone }}>
                  Options
                </div>
                <div className="flex flex-col gap-1.5">
                  {variants.map(v => (
                    <div key={v.id} className="flex items-center justify-between rounded-[10px] px-3 py-2" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
                      <span className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.charcoal }}>
                        {v.amount} {v.unit}
                      </span>
                      <span className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ color: c.green }}>
                        {formatIQD(v.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              {p.in_stock ? (
                <AddToCartButton
                  productId={p.id}
                  shopId={p.shop_id}
                  shopName={p.bazaar_shops.name}
                  shopSlug={p.bazaar_shops.slug}
                  name={p.name_en}
                  price={basePrice}
                  salePrice={activeSale?.sale_price ?? null}
                  unit={p.unit}
                  imageUrl={p.image_url}
                />
              ) : (
                <div className="inline-block px-4 py-2 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ background: c.cream, color: c.stone }}>
                  Out of stock
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CartBar />
    </div>
  )
}
