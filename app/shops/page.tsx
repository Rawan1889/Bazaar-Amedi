export const dynamic = 'force-dynamic'
import { createBazaarServer } from '@/lib/bazaar/supabase-server'
import Link from 'next/link'
import { CartBar } from '@/app/components/cart-bar'
import { CustomerNav } from '@/app/components/customer-nav'
import { FavoriteButton } from '@/app/components/favorite-button'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  bg:       '#FAFAF7',
  white:    '#FFFFFF',
} as const

export default async function ShopsPage() {
  const supabase = await createBazaarServer()

  const { data: shops } = await supabase
    .from('bazaar_shops')
    .select('id, name, slug, description, logo_url, cover_url, address, is_open, bazaar_categories(name_en)')
    .eq('is_approved', true)
    .order('name')

  const open = (shops || []).filter(s => s.is_open)
  const closed = (shops || []).filter(s => !s.is_open)
  const sorted = [...open, ...closed]

  return (
    <div className="min-h-[100dvh] pb-20 md:pb-0" style={{ background: c.bg }}>
      <CustomerNav />

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <h1 className="font-[family-name:var(--font-dm-sans)] text-[28px] font-medium mb-1" style={{ color: c.charcoal }}>
          Markets in Amedi
        </h1>
        <p className="font-[family-name:var(--font-dm-sans)] text-[14px] mb-8" style={{ color: c.stone }}>
          {open.length} open now · {sorted.length} total
        </p>

        {sorted.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: c.greenBg }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="font-[family-name:var(--font-dm-sans)] text-[20px] font-medium mb-1" style={{ color: c.charcoal }}>
              No shops yet
            </h2>
            <p className="font-[family-name:var(--font-dm-sans)] text-[14px]" style={{ color: c.stone }}>
              Shops are being set up. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map(shop => {
              const category = (Array.isArray(shop.bazaar_categories) ? shop.bazaar_categories[0] : shop.bazaar_categories) as { name_en: string } | null
              return (
                <Link
                  key={shop.id}
                  href={`/s/${shop.slug}`}
                  className="rounded-[16px] overflow-hidden no-underline transition-all duration-200 group relative"
                  style={{ background: c.white, border: `1px solid ${c.cream2}` }}
                >
                  {/* Cover / header image */}
                  <div className="h-[120px] relative overflow-hidden" style={{ background: c.cream }}>
                    {shop.cover_url ? (
                      <img src={shop.cover_url} alt={shop.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="font-[family-name:var(--font-dm-sans)] text-[48px] font-medium" style={{ color: c.cream2 }}>
                          {shop.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    {/* Open/closed badge */}
                    <div
                      className="absolute top-3 left-3 px-2 py-0.5 rounded-[6px] font-[family-name:var(--font-dm-mono)] text-[10px] font-medium"
                      style={{ background: shop.is_open ? c.green : c.stone, color: '#fff' }}
                    >
                      {shop.is_open ? 'Open' : 'Closed'}
                    </div>
                    {/* Favorite button */}
                    <div className="absolute top-3 right-3" onClick={e => e.preventDefault()}>
                      <FavoriteButton
                        item={{
                          id: shop.id,
                          type: 'shop',
                          name: shop.name,
                          imageUrl: shop.logo_url,
                          slug: shop.slug,
                        }}
                      />
                    </div>
                  </div>

                  {/* Logo + info */}
                  <div className="p-4 flex gap-3">
                    <div
                      className="w-12 h-12 rounded-[10px] flex-shrink-0 overflow-hidden flex items-center justify-center"
                      style={{ background: shop.logo_url ? 'transparent' : c.greenBg, border: `1px solid ${c.cream2}` }}
                    >
                      {shop.logo_url ? (
                        <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-[family-name:var(--font-dm-sans)] text-[18px] font-medium" style={{ color: c.green }}>
                          {shop.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-[family-name:var(--font-dm-sans)] text-[15px] font-medium truncate" style={{ color: c.charcoal }}>
                        {shop.name}
                      </div>
                      {category && (
                        <div className="font-[family-name:var(--font-dm-mono)] text-[10px] mt-0.5" style={{ color: c.green }}>
                          {category.name_en}
                        </div>
                      )}
                      {shop.address && (
                        <div className="font-[family-name:var(--font-dm-sans)] text-[12px] mt-1 truncate flex items-center gap-1" style={{ color: c.stone }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                          </svg>
                          {shop.address}
                        </div>
                      )}
                      {shop.description && (
                        <div className="font-[family-name:var(--font-dm-sans)] text-[12px] mt-1 line-clamp-2" style={{ color: c.stone }}>
                          {shop.description}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <CartBar />
    </div>
  )
}
