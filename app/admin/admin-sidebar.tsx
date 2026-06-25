'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import type { BazaarProfile } from '@/lib/bazaar/types'
import { bazaarLogout } from '@/lib/bazaar/auth'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
} as const

const links: { href: string; label: string; icon: string }[] = [
  { href: '/admin', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/admin/shops', label: 'Shops', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { href: '/admin/categories', label: 'Categories', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
  { href: '/admin/orders', label: 'All Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { href: '/admin/zones', label: 'Delivery Zones', icon: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 13a3 3 0 100-6 3 3 0 000 6z' },
  { href: '/admin/cash', label: 'Driver Cash', icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
  { href: '/admin/users', label: 'Users', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
]

export function AdminSidebar({ user }: { user: BazaarProfile }) {
  const pathname = usePathname()

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-[240px] flex flex-col py-6 px-4"
      style={{ background: c.white, borderRight: `1px solid ${c.cream2}` }}
    >
      <Link href="/" className="no-underline mb-2 px-3">
        <span className="font-[family-name:var(--font-dm-sans)] text-[20px] font-medium" style={{ color: c.charcoal }}>
          bazaar<span style={{ color: c.green }}>.</span>
        </span>
      </Link>
      <div className="px-3 mb-6">
        <span
          className="px-2 py-0.5 rounded-[4px] font-[family-name:var(--font-dm-mono)] text-[9px] font-medium tracking-[0.1em] uppercase"
          style={{ background: c.greenBg, color: c.green }}
        >
          Admin
        </span>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {links.map(link => {
          const active = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href))
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
            className="w-8 h-8 rounded-full flex items-center justify-center font-[family-name:var(--font-dm-sans)] text-[12px] font-medium"
            style={{ background: c.greenBg, color: c.green }}
          >
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium truncate" style={{ color: c.charcoal }}>
              {user.full_name}
            </div>
            <div className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>
              Super admin
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
