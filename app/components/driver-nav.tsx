'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { bazaarLogout } from '@/lib/bazaar/auth'
import { LanguageSwitcher } from '@/app/components/language-switcher'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
  error:    '#C94A3A',
} as const

const tabs = [
  {
    href: '/driver',
    label: 'Deliveries',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? c.green : c.stone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m-4 12h8a2 2 0 002-2v-3a2 2 0 00-2-2h-8a2 2 0 00-2 2v3a2 2 0 002 2z" />
        <circle cx="7.5" cy="17.5" r="2.5" />
        <circle cx="17.5" cy="17.5" r="2.5" />
      </svg>
    ),
  },
  {
    href: '/driver/earnings',
    label: 'Earnings',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? c.green : c.stone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    href: '/driver/profile',
    label: 'Profile',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? c.green : c.stone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

interface Props {
  userName: string
  exact?: boolean
}

export function DriverNav({ userName, exact = false }: Props) {
  const pathname = usePathname()

  return (
    <>
      {/* Top bar */}
      <nav
        className="sticky top-0 z-20 px-6 py-4"
        style={{ background: 'rgba(250,250,247,0.95)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${c.cream2}` }}
      >
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-[family-name:var(--font-dm-sans)] text-[20px] font-medium" style={{ color: c.charcoal }}>
              bazaar<span style={{ color: c.green }}>.</span>
            </span>
            <span className="font-[family-name:var(--font-dm-mono)] text-[10px] px-2 py-0.5 rounded-[4px]" style={{ background: c.greenBg, color: c.green }}>
              Driver
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            {tabs.map(t => {
              const active = exact ? pathname === t.href : (pathname === t.href || pathname.startsWith(t.href + '/'))
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className="font-[family-name:var(--font-dm-sans)] text-[13px] no-underline"
                  style={{ color: active ? c.green : c.stone, fontWeight: active ? 500 : 400 }}
                >
                  {t.label}
                </Link>
              )
            })}
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <span className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.stone }}>
              {userName}
            </span>
            <form action={bazaarLogout}>
              <button
                type="submit"
                className="font-[family-name:var(--font-dm-sans)] text-[12px] border-none bg-transparent cursor-pointer px-0"
                style={{ color: c.error }}
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 md:hidden"
        style={{ background: 'rgba(250,250,247,0.95)', backdropFilter: 'blur(12px)', borderTop: `1px solid ${c.cream2}` }}
      >
        <div className="flex items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {tabs.map(t => {
            const active = pathname === t.href || (t.href !== '/driver' && pathname.startsWith(t.href + '/'))
            return (
              <Link
                key={t.href}
                href={t.href}
                className="flex flex-col items-center gap-0.5 px-4 py-1 no-underline"
              >
                {t.icon(active)}
                <span
                  className="font-[family-name:var(--font-dm-sans)] text-[10px]"
                  style={{ color: active ? c.green : c.stone, fontWeight: active ? 500 : 400 }}
                >
                  {t.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
