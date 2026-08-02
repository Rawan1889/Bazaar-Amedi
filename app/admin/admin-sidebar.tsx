'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import type { BazaarProfile } from '@/lib/bazaar/types'
import { bazaarLogout } from '@/lib/bazaar/auth'
import { LanguageSwitcher } from '@/app/components/language-switcher'
import { KelaMark } from '@/app/components/kela-mark'

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
  { href: '/admin/payouts', label: 'Payouts', icon: 'M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4M4 6v12c0 1.1.9 2 2 2h14v-4M18 12a2 2 0 000 4h4v-4h-4z' },
  { href: '/admin/banners', label: 'Promo Banner', icon: 'M3 11l18-5v12L3 14v-3zM11.6 16.8a3 3 0 11-5.8-1.6' },
  { href: '/admin/support', label: 'Support', icon: 'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z' },
  { href: '/admin/users', label: 'Users', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
]

export function AdminSidebar({ user }: { user: BazaarProfile }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Open menu"
        className="md:hidden fixed top-3 left-3 z-40 w-10 h-10 rounded-[10px] flex items-center justify-center"
        style={{ background: c.white, border: `1px solid ${c.cream2}` }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.charcoal} strokeWidth="1.75" strokeLinecap="round">
          <path d={open ? 'M6 6l12 12M6 18L18 6' : 'M4 6h16M4 12h16M4 18h16'} />
        </svg>
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="md:hidden fixed inset-0 z-30"
          style={{ background: 'rgba(30,28,25,0.4)' }}
        />
      )}

      <aside
        className={`fixed left-0 top-0 bottom-0 w-[240px] flex flex-col py-6 px-4 z-40 transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        style={{ background: c.white, borderRight: `1px solid ${c.cream2}` }}
      >
      <Link href="/" className="no-underline mb-2 px-3 flex items-center gap-2">
        <KelaMark size={22} gateColor={c.white} />
        <span className="font-[family-name:var(--font-dm-sans)] text-[20px] font-medium" style={{ color: c.charcoal }}>
          kela<span style={{ color: c.green }}>.</span>
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
        <div className="mb-2">
          <LanguageSwitcher />
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
    </>
  )
}
