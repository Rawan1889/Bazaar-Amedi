'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createBazaarClient } from '@/lib/bazaar/supabase-client'
import { bazaarLogout } from '@/lib/bazaar/auth'
import { LanguageSwitcher } from './language-switcher'
import { useCart } from '@/lib/bazaar/cart-context'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
  error:    '#C94A3A',
} as const

type Profile = { full_name: string; role: string; neighborhood: string | null }

export function CustomerNav() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { itemCount } = useCart()

  useEffect(() => {
    const supabase = createBazaarClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return
      const { data: p } = await supabase
        .from('bazaar_profiles')
        .select('full_name, role, neighborhood')
        .eq('id', data.session.user.id)
        .single()
      if (p) setProfile(p)
    })
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <nav
      className="sticky top-0 z-10 px-6 py-4"
      style={{ background: 'rgba(250,250,247,0.9)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${c.cream2}` }}
    >
      <div className="max-w-[1200px] mx-auto flex items-center justify-between">
        <Link href="/" className="no-underline">
          <span className="font-[family-name:var(--font-dm-sans)] text-[20px] font-medium" style={{ color: c.charcoal }}>
            bazaar<span style={{ color: c.green }}>.</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />

          {profile ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setOpen(v => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-[10px] border-none cursor-pointer transition-all duration-150"
                style={{ background: open ? c.greenBg : 'transparent', border: `1px solid ${open ? c.green : c.cream2}` }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center font-[family-name:var(--font-dm-mono)] text-[11px] font-medium"
                  style={{ background: c.green, color: '#fff' }}
                >
                  {initials}
                </div>
                <span className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium hidden sm:block" style={{ color: c.charcoal }}>
                  {profile.full_name.split(' ')[0]}
                </span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <path d="M2 4l4 4 4-4" stroke={c.stone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {open && (
                <div
                  className="absolute right-0 top-[calc(100%+8px)] w-[220px] rounded-[12px] py-1.5 z-50"
                  style={{ background: c.white, border: `1px solid ${c.cream2}`, boxShadow: '0 8px 32px rgba(30,28,25,0.10)' }}
                >
                  <div className="px-4 py-2.5 border-b" style={{ borderColor: c.cream2 }}>
                    <div className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ color: c.charcoal }}>
                      {profile.full_name}
                    </div>
                    <div className="font-[family-name:var(--font-dm-mono)] text-[10px] mt-0.5 capitalize" style={{ color: c.stone }}>
                      {profile.role.replace('_', ' ')}
                    </div>
                  </div>

                  {[
                    { href: '/orders',    label: 'My Orders',   icon: '📦' },
                    { href: '/favorites', label: 'Saved Items',  icon: '♡' },
                    { href: '/cart',      label: 'My Cart',     icon: '🛒' },
                  ].map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 no-underline transition-colors duration-150 hover:bg-[rgba(45,138,94,0.05)]"
                    >
                      <span className="text-[14px]">{item.icon}</span>
                      <span className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.charcoal }}>
                        {item.label}
                      </span>
                    </Link>
                  ))}

                  <div className="border-t mt-1" style={{ borderColor: c.cream2 }}>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2.5 border-none cursor-pointer bg-transparent transition-colors duration-150 hover:bg-[rgba(201,74,58,0.05)]"
                      onClick={() => { setOpen(false); bazaarLogout() }}
                    >
                      <span className="text-[14px]">→</span>
                      <span className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.error }}>
                        Sign out
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="font-[family-name:var(--font-dm-sans)] text-[13px] no-underline" style={{ color: c.stone }}>
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 rounded-[8px] font-[family-name:var(--font-dm-sans)] text-[13px] font-medium no-underline"
                style={{ background: c.green, color: '#fff' }}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
