'use client'

import Link from 'next/link'
import { useFavorites } from '@/lib/bazaar/favorites-context'
import { FavoriteButton } from '@/app/components/favorite-button'
import { CartBar } from '@/app/components/cart-bar'
import type { Route } from 'next'

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

export default function FavoritesPage() {
  const { favorites } = useFavorites()

  const shops = favorites.filter(f => f.type === 'shop')
  const products = favorites.filter(f => f.type === 'product')

  return (
    <div className="min-h-[100dvh] pb-20 md:pb-0" style={{ background: c.bg }}>
      <nav className="sticky top-0 z-10 px-6 py-4" style={{ background: 'rgba(250,250,247,0.9)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${c.cream2}` }}>
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="no-underline">
              <span className="font-[family-name:var(--font-dm-sans)] text-[20px] font-medium" style={{ color: c.charcoal }}>
                bazaar<span style={{ color: c.green }}>.</span>
              </span>
            </Link>
            <span style={{ color: c.cream2 }}>/</span>
            <span className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.stone }}>Favorites</span>
          </div>
          <Link href="/browse" className="font-[family-name:var(--font-dm-sans)] text-[13px] no-underline" style={{ color: c.green }}>
            Browse
          </Link>
        </div>
      </nav>

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <h1 className="font-[family-name:var(--font-dm-sans)] text-[28px] font-medium mb-2" style={{ color: c.charcoal }}>
          Favorites
        </h1>
        <p className="font-[family-name:var(--font-dm-sans)] text-[14px] mb-8" style={{ color: c.stone }}>
          Your saved shops and products for quick access.
        </p>

        {favorites.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: c.greenBg }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            </div>
            <h2 className="font-[family-name:var(--font-dm-sans)] text-[18px] font-medium mb-1" style={{ color: c.charcoal }}>
              No favorites yet
            </h2>
            <p className="font-[family-name:var(--font-dm-sans)] text-[13px] mb-4" style={{ color: c.stone }}>
              Tap the heart icon on any product or shop to save it here.
            </p>
            <Link
              href="/browse"
              className="inline-block px-5 py-2.5 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[13px] font-medium no-underline"
              style={{ background: c.green, color: '#fff' }}
            >
              Browse markets
            </Link>
          </div>
        ) : (
          <>
            {shops.length > 0 && (
              <div className="mb-8">
                <h2 className="font-[family-name:var(--font-dm-sans)] text-[16px] font-medium mb-4" style={{ color: c.charcoal }}>
                  Shops ({shops.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {shops.map(shop => (
                    <Link
                      key={shop.id}
                      href={`/bazaar/s/${shop.slug}` as Route}
                      className="rounded-[14px] p-4 no-underline flex items-center gap-3 transition-all duration-150"
                      style={{ background: c.white, border: `1px solid ${c.cream2}` }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = c.green)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = c.cream2)}
                    >
                      <div className="w-12 h-12 rounded-[10px] flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: c.greenBg }}>
                        {shop.imageUrl ? (
                          <img src={shop.imageUrl} alt={shop.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-[family-name:var(--font-dm-sans)] text-[18px] font-medium" style={{ color: c.green }}>
                            {shop.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium truncate" style={{ color: c.charcoal }}>
                          {shop.name}
                        </div>
                      </div>
                      <FavoriteButton item={shop} />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {products.length > 0 && (
              <div>
                <h2 className="font-[family-name:var(--font-dm-sans)] text-[16px] font-medium mb-4" style={{ color: c.charcoal }}>
                  Products ({products.length})
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map(product => (
                    <Link
                      key={product.id}
                      href={`/bazaar/s/${product.shopSlug}` as Route}
                      className="rounded-[14px] overflow-hidden no-underline transition-all duration-150"
                      style={{ background: c.white, border: `1px solid ${c.cream2}` }}
                    >
                      <div className="aspect-square relative" style={{ background: c.cream }}>
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="font-[family-name:var(--font-dm-sans)] text-[32px] font-medium" style={{ color: c.cream2 }}>
                              {product.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <FavoriteButton item={product} />
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium truncate" style={{ color: c.charcoal }}>
                          {product.name}
                        </div>
                        {product.shopName && (
                          <div className="font-[family-name:var(--font-dm-mono)] text-[10px] mb-1" style={{ color: c.stone }}>
                            {product.shopName}
                          </div>
                        )}
                        {product.price && (
                          <span className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: c.green }}>
                            {formatIQD(product.price)}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <CartBar />
    </div>
  )
}
