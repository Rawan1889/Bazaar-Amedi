'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import type { BazaarProfile } from '@/lib/bazaar/types'
import { bazaarLogout } from '@/lib/bazaar/auth'
import { NotificationBell } from '@/app/components/notification-bell'

const c = {
  green:     '#2D8A5E',
  greenBg:   'rgba(45,138,94,0.08)',
  saffron:   '#E8A838',
  saffronBg: 'rgba(232,168,56,0.12)',
  charcoal:  '#1E1C19',
  stone:     '#7A756E',
  cream:     '#F2EFEA',
  cream2:    '#E8E4DE',
  white:     '#FFFFFF',
} as const

const links: { href: string; label: string; icon: string }[] = [
  { href: '/shop', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/shop/products', label: 'Products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { href: '/shop/orders', label: 'Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { href: '/shop/flash-sales', label: 'Flash Sales', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { href: '/shop/coupons', label: 'Coupons', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { href: '/shop/analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { href: '/shop/earnings', label: 'Earnings', icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
  { href: '/shop/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
]

export function ShopSidebar({ user }: { user: BazaarProfile }) {
  const pathname = usePathname()

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-[240px] flex flex-col py-6 px-4"
      style={{ background: c.white, borderRight: `1px solid ${c.cream2}` }}
    >
      <div className="flex items-center justify-between mb-8 px-3">
        <Link href="/" className="no-underline">
          <span className="font-[family-name:var(--font-dm-sans)] text-[20px] font-medium" style={{ color: c.charcoal }}>
            bazaar<span style={{ color: c.green }}>.</span>
          </span>
        </Link>
        <NotificationBell dropdownSide="left" />
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {links.map(link => {
          const active = pathname === link.href || (link.href !== '/shop' && pathname.startsWith(link.href))
          return (
            <Link
              key={link.href}
              href={link.href as Route}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] no-underline transition-all duration-150 font-[family-name:var(--font-dm-sans)] text-[14px]"
              style={{
                background: active ? c.greenBg : 'transparent',
                color: active ? c.green : c.stone,
                fontWeight: active ? 500 : 400,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={link.icon} />
              </svg>
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 pt-4" style={{ borderTop: `1px solid ${c.cream}` }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-[family-name:var(--font-dm-sans)] text-[12px] font-medium flex-shrink-0"
            style={{ background: c.saffronBg, color: c.saffron }}
          >
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium truncate" style={{ color: c.charcoal }}>
              {user.full_name}
            </div>
            <div className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.saffron }}>
              Market owner
            </div>
          </div>
        </div>
        <form action={bazaarLogout}>
          <button
            type="submit"
            className="w-full text-left px-0 py-1.5 font-[family-name:var(--font-dm-sans)] text-[12px] border-none bg-transparent cursor-pointer transition-colors duration-150"
            style={{ color: c.stone }}
            onMouseEnter={e => (e.currentTarget.style.color = c.charcoal)}
            onMouseLeave={e => (e.currentTarget.style.color = c.stone)}
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
