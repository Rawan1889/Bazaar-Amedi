export const dynamic = 'force-dynamic'
import { createBazaarServer } from '@/lib/bazaar/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { AddToCartButton } from '@/app/components/add-to-cart-button'
import { CartBar } from '@/app/components/cart-bar'
import { ShopFavoriteButton } from './shop-favorite-button'
import { getShopReviews, getShopRating } from '@/lib/bazaar/review-actions'
import { ReviewSection } from '@/app/components/review-section'
import { isFollowing, getFollowerCount } from '@/lib/bazaar/follower-actions'
import { FollowButton } from '@/app/components/follow-button'
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

function formatTime(time: string | null) {
  if (!time) return null
  const [h, m] = time.split(':')
  const hour = parseInt(h)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${display}:${m} ${suffix}`
}

export default async function ShopPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createBazaarServer()

  const { data: shop } = await supabase
    .from('bazaar_shops')
    .select('*, bazaar_categories(name_en), bazaar_profiles!bazaar_shops_owner_id_fkey(full_name)')
    .eq('slug', slug)
    .single()

  if (!shop) notFound()

  const { data: products } = await supabase
    .from('bazaar_products')
    .select('*, bazaar_categories(name_en, name_ku, name_ar), bazaar_flash_sales(sale_price, ends_at, is_active)')
    .eq('shop_id', shop.id)
    .eq('in_stock', true)
    .order('sort_order')

  const opensAt = formatTime(shop.opens_at)
  const closesAt = formatTime(shop.closes_at)

  const [reviews, { average: averageRating, count: reviewCount }, following, followerCount] = await Promise.all([
    getShopReviews(shop.id),
    getShopRating(shop.id),
    isFollowing(shop.id),
    getFollowerCount(shop.id),
  ])

  return (
    <div className="min-h-[100dvh] pb-20 md:pb-0" style={{ background: c.bg }}>
      {/* Nav */}
      <nav className="sticky top-0 z-10 px-6 py-4" style={{ background: 'rgba(250,250,247,0.9)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${c.cream2}` }}>
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="no-underline">
              <span className="font-[family-name:var(--font-dm-sans)] text-[20px] font-medium" style={{ color: c.charcoal }}>
                bazaar<span style={{ color: c.green }}>.</span>
              </span>
            </Link>
            <span className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.cream2 }}>/</span>
            <Link href="/browse" className="font-[family-name:var(--font-dm-sans)] text-[13px] no-underline" style={{ color: c.stone }}>
              Browse
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="font-[family-name:var(--font-dm-sans)] text-[13px] no-underline" style={{ color: c.stone }}>
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      {/* Cover image */}
      {shop.cover_url && (
        <div className="w-full h-[200px] md:h-[280px] overflow-hidden relative">
          <img src={shop.cover_url} alt={`${shop.name} cover`} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(250,250,247,0.9))' }} />
        </div>
      )}

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Shop header */}
        <div className="flex items-start gap-5 mb-8" style={{ marginTop: shop.cover_url ? '-3rem' : '0', position: 'relative', zIndex: 1 }}>
          <div
            className="w-20 h-20 rounded-[16px] flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ background: shop.logo_url ? 'transparent' : c.greenBg, border: `3px solid ${c.bg}` }}
          >
            {shop.logo_url ? (
              <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover rounded-[14px]" />
            ) : (
              <span className="font-[family-name:var(--font-dm-sans)] text-[28px] font-medium" style={{ color: c.green }}>
                {shop.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-[family-name:var(--font-dm-sans)] text-[28px] font-medium mb-1" style={{ color: c.charcoal }}>
                {shop.name}
              </h1>
              <div className="flex items-center gap-2">
                <FollowButton shopId={shop.id} initialFollowing={following} followerCount={followerCount} />
                <ShopFavoriteButton
                  shopId={shop.id}
                  shopName={shop.name}
                  shopSlug={shop.slug}
                  logoUrl={shop.logo_url}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {shop.bazaar_categories && (
                <span className="font-[family-name:var(--font-dm-mono)] text-[11px] px-2 py-0.5 rounded-[4px]" style={{ background: c.cream, color: c.stone }}>
                  {(shop.bazaar_categories as { name_en: string }).name_en}
                </span>
              )}
              <span
                className="font-[family-name:var(--font-dm-mono)] text-[11px] px-2 py-0.5 rounded-[4px]"
                style={{
                  background: shop.is_open ? c.greenBg : 'rgba(196,101,74,0.08)',
                  color: shop.is_open ? c.green : c.terra,
                }}
              >
                {shop.is_open ? 'Open now' : 'Closed'}
              </span>
              {(opensAt && closesAt) && (
                <span className="font-[family-name:var(--font-dm-mono)] text-[10px] px-2 py-0.5 rounded-[4px]" style={{ background: c.cream, color: c.stone }}>
                  {opensAt} — {closesAt}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {shop.address && (
                <span className="flex items-center gap-1 font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ color: c.stone }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c.stone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {shop.address}
                </span>
              )}
              {shop.phone && (
                <span className="flex items-center gap-1 font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ color: c.stone }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c.stone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                  {shop.phone}
                </span>
              )}
            </div>
            {shop.description && (
              <p className="font-[family-name:var(--font-dm-sans)] text-[14px] mt-3 max-w-[65ch]" style={{ color: c.stone }}>
                {shop.description}
              </p>
            )}
          </div>
        </div>

        {/* Products */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-[family-name:var(--font-dm-sans)] text-[18px] font-medium" style={{ color: c.charcoal }}>
            Products
          </h2>
          {products && products.length > 0 && (
            <span className="font-[family-name:var(--font-dm-mono)] text-[11px]" style={{ color: c.stone }}>
              {products.length} item{products.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {(!products || products.length === 0) ? (
          <div className="text-center py-16">
            <h2 className="font-[family-name:var(--font-dm-sans)] text-[18px] font-medium mb-1" style={{ color: c.charcoal }}>
              No products listed yet
            </h2>
            <p className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.stone }}>
              This shop is still setting up their catalog.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product: Record<string, unknown>) => {
              const p = product as {
                id: string; name_en: string; name_ku: string | null; name_ar: string | null; price: number; unit: string; image_url: string | null; description: string | null
                bazaar_categories: { name_en: string; name_ku: string | null; name_ar: string | null } | null
                bazaar_flash_sales: { sale_price: number; ends_at: string; is_active: boolean }[] | null
              }
              const activeSale = p.bazaar_flash_sales?.find(s => s.is_active && new Date(s.ends_at) > new Date())

              return (
                <div
                  key={p.id}
                  className="rounded-[14px] overflow-hidden"
                  style={{ background: c.white, border: `1px solid ${c.cream2}` }}
                >
                  <div className="aspect-square relative" style={{ background: c.cream }}>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name_en} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="font-[family-name:var(--font-dm-sans)] text-[32px] font-medium" style={{ color: c.cream2 }}>
                          {p.name_en.charAt(0)}
                        </span>
                      </div>
                    )}
                    {activeSale && (
                      <div
                        className="absolute top-2 left-2 px-2 py-1 rounded-[6px] font-[family-name:var(--font-dm-mono)] text-[10px] font-medium"
                        style={{ background: c.terra, color: '#fff' }}
                      >
                        SALE
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium mb-0.5" style={{ color: c.charcoal }}>
                      <LocalizedName en={p.name_en} ku={p.name_ku} ar={p.name_ar} />
                    </div>
                    {p.bazaar_categories && (
                      <div className="font-[family-name:var(--font-dm-mono)] text-[10px] mb-2" style={{ color: c.stone }}>
                        <LocalizedName en={p.bazaar_categories.name_en} ku={p.bazaar_categories.name_ku} ar={p.bazaar_categories.name_ar} />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {activeSale ? (
                          <>
                            <span className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: c.terra }}>
                              {formatIQD(activeSale.sale_price)}
                            </span>
                            <span className="font-[family-name:var(--font-dm-sans)] text-[11px] line-through" style={{ color: c.stone }}>
                              {formatIQD(p.price)}
                            </span>
                          </>
                        ) : (
                          <span className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: c.green }}>
                            {formatIQD(p.price)}
                          </span>
                        )}
                        <span className="font-[family-name:var(--font-dm-mono)] text-[9px]" style={{ color: c.stone }}>
                          /{p.unit}
                        </span>
                      </div>
                      <AddToCartButton
                        productId={p.id}
                        shopId={shop.id}
                        shopName={shop.name}
                        shopSlug={shop.slug}
                        name={p.name_en}
                        price={p.price}
                        salePrice={activeSale?.sale_price ?? null}
                        unit={p.unit}
                        imageUrl={p.image_url}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <ReviewSection
          shopId={shop.id}
          reviews={reviews as { id: string; rating: number; comment: string | null; created_at: string; bazaar_profiles: { full_name: string } | null }[]}
          averageRating={averageRating}
          reviewCount={reviewCount}
        />
      </div>

      <CartBar />
    </div>
  )
}
