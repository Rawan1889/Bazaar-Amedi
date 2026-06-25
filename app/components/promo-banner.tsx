'use client'

import { useEffect, useState } from 'react'
import { getActiveBanner, type PromoBanner } from '@/lib/bazaar/banner-actions'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
} as const

const DISMISS_KEY = 'bazaar-banner-dismissed'

// Storefront popup for the current promo banner. Dismissals are remembered
// per-banner so a returning customer isn't nagged by the same offer.
export function PromoBanner() {
  const [banner, setBanner] = useState<PromoBanner | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    getActiveBanner().then(b => {
      if (!b) return
      let dismissed = false
      try { dismissed = localStorage.getItem(DISMISS_KEY) === b.id } catch {}
      if (!dismissed) { setBanner(b); setShow(true) }
    })
  }, [])

  function dismiss() {
    if (banner) { try { localStorage.setItem(DISMISS_KEY, banner.id) } catch {} }
    setShow(false)
  }

  if (!show || !banner) return null

  return (
    <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center p-4" style={{ background: 'rgba(30,28,25,0.4)' }} onClick={dismiss}>
      <div
        className="w-full max-w-[420px] rounded-[18px] p-6 relative"
        style={{ background: c.white, border: `1px solid ${c.cream2}`, boxShadow: '0 20px 60px rgba(30,28,25,0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 p-1 border-none bg-transparent cursor-pointer"
          style={{ color: c.stone }}
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="w-11 h-11 rounded-full flex items-center justify-center mb-4" style={{ background: c.greenBg }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
          </svg>
        </div>

        <h3 className="font-[family-name:var(--font-dm-sans)] text-[19px] font-medium mb-1.5" style={{ color: c.charcoal }}>
          {banner.title}
        </h3>
        {banner.message && (
          <p className="font-[family-name:var(--font-dm-sans)] text-[14px] leading-relaxed mb-4" style={{ color: c.stone }}>
            {banner.message}
          </p>
        )}

        {banner.link_url && (
          <a
            href={banner.link_url}
            onClick={dismiss}
            className="inline-block px-4 py-2.5 rounded-[10px] no-underline font-[family-name:var(--font-dm-sans)] text-[14px] font-medium"
            style={{ background: c.green, color: c.white }}
          >
            {banner.link_label || 'See offer'}
          </a>
        )}
      </div>
    </div>
  )
}
