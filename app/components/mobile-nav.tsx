'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/lib/bazaar/cart-context'
import { useFavorites } from '@/lib/bazaar/favorites-context'
import type { Route } from 'next'

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

const tabs: { href: string; label: string; icon: (active: boolean) => React.ReactNode; badge?: 'cart' | 'favorites' }[] = [
  {
    href: '/browse',
    label: 'Browse',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? c.green : c.stone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    ),
  },
  {
    href: '/favorites',
    label: 'Favorites',
    badge: 'favorites',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? c.green : 'none'} stroke={active ? c.green : c.stone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
  },
  {
    href: '/cart',
    label: 'Cart',
    badge: 'cart',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? c.green : c.stone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
  {
    href: '/orders',
    label: 'Orders',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? c.green : c.stone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? c.green : c.stone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export function MobileNav() {
  const pathname = usePathname()
  const { itemCount } = useCart()
  const { favoriteCount } = useFavorites()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 md:hidden"
      style={{ background: 'rgba(250,250,247,0.95)', backdropFilter: 'blur(12px)', borderTop: `1px solid ${c.cream2}` }}
    >
      <div className="flex items-center justify-around px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {tabs.map(tab => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + '/')
          const badgeCount = tab.badge === 'cart' ? itemCount : tab.badge === 'favorites' ? favoriteCount : 0

          return (
            <Link
              key={tab.href}
              href={tab.href as Route}
              className="flex flex-col items-center gap-0.5 px-3 py-1 no-underline relative"
            >
              <div className="relative">
                {tab.icon(active)}
                {badgeCount > 0 && (
                  <div
                    className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] rounded-full flex items-center justify-center font-[family-name:var(--font-dm-mono)] text-[8px] font-bold"
                    style={{ background: c.green, color: '#fff' }}
                  >
                    {badgeCount}
                  </div>
                )}
              </div>
              <span
                className="font-[family-name:var(--font-dm-sans)] text-[10px]"
                style={{ color: active ? c.green : c.stone, fontWeight: active ? 500 : 400 }}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
