'use client'

import Link from 'next/link'
import { useCart } from '@/lib/bazaar/cart-context'

const c = {
  green:    '#2D8A5E',
  charcoal: '#1E1C19',
  white:    '#FFFFFF',
} as const

function formatIQD(amount: number) {
  return new Intl.NumberFormat('en-IQ').format(amount) + ' IQD'
}

export function CartBar() {
  const { itemCount, shopCount, subtotal } = useCart()

  if (itemCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
      <Link
        href="/cart"
        className="flex items-center gap-4 px-5 py-3 rounded-[14px] no-underline shadow-lg transition-all duration-200"
        style={{ background: c.charcoal, color: c.white }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'translateX(-50%) scale(1.02)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'translateX(-50%) scale(1)')}
      >
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
          </svg>
          <span className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium">
            Cart
          </span>
        </div>

        <span className="font-[family-name:var(--font-dm-mono)] text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {shopCount} shop{shopCount !== 1 ? 's' : ''}, {itemCount} item{itemCount !== 1 ? 's' : ''}
        </span>

        <span className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ color: c.green }}>
          {formatIQD(subtotal)}
        </span>
      </Link>
    </div>
  )
}
