'use client'

import { useState, useTransition } from 'react'
import { applyCoupon } from '@/lib/bazaar/coupon-actions'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream2:   '#E8E4DE',
  error:    '#C94A3A',
  errorBg:  'rgba(201,74,58,0.08)',
} as const

interface Props {
  shopIds: string[]
  subtotal: number
  onApply: (discount: number, description: string) => void
  onRemove: () => void
  applied: { discount: number; description: string } | null
}

export function CouponInput({ shopIds, subtotal, onApply, onRemove, applied }: Props) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleApply() {
    if (!code.trim()) return
    setError(null)
    startTransition(async () => {
      const result = await applyCoupon(code, shopIds, subtotal)
      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        onApply(result.discount!, result.description!)
        setCode('')
      }
    })
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between px-3 py-2 rounded-[8px]" style={{ background: c.greenBg }}>
        <div className="flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span className="font-[family-name:var(--font-dm-sans)] text-[12px] font-medium" style={{ color: c.green }}>
            {applied.description}
          </span>
        </div>
        <button
          onClick={onRemove}
          className="font-[family-name:var(--font-dm-sans)] text-[11px] border-none bg-transparent cursor-pointer"
          style={{ color: c.stone }}
        >
          Remove
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setError(null) }}
          placeholder="Coupon code"
          className="flex-1 rounded-[8px] px-3 py-2 text-[12px] font-[family-name:var(--font-dm-sans)] outline-none uppercase"
          style={{ border: `1px solid ${c.cream2}`, color: c.charcoal }}
        />
        <button
          onClick={handleApply}
          disabled={isPending || !code.trim()}
          className="px-3 py-2 rounded-[8px] font-[family-name:var(--font-dm-sans)] text-[12px] font-medium border-none cursor-pointer"
          style={{ background: c.green, color: '#fff', opacity: isPending ? 0.7 : 1 }}
        >
          {isPending ? '...' : 'Apply'}
        </button>
      </div>
      {error && (
        <div className="mt-1 font-[family-name:var(--font-dm-sans)] text-[11px]" style={{ color: c.error }}>
          {error}
        </div>
      )}
    </div>
  )
}
