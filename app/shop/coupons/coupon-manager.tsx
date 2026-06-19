'use client'

import { useState, useTransition } from 'react'
import { createCoupon, toggleCoupon, deleteCoupon } from '@/lib/bazaar/coupon-actions'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  terra:    '#C4654A',
  terraBg:  'rgba(196,101,74,0.08)',
  saffron:  '#E8A838',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
  error:    '#C94A3A',
  errorBg:  'rgba(201,74,58,0.08)',
} as const

interface Coupon {
  id: string
  code: string
  discount_type: string
  discount_value: number
  min_order: number
  max_uses: number | null
  uses_count: number
  is_active: boolean
  expires_at: string | null
  created_at: string
}

export function CouponManager({ coupons }: { coupons: unknown[] }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleCreate(formData: FormData) {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await createCoupon(formData)
      if (result.error) setError(result.error)
      else { setSuccess(true); setTimeout(() => setSuccess(false), 3000) }
    })
  }

  function handleToggle(id: string, active: boolean) {
    startTransition(() => { toggleCoupon(id, active) })
  }

  function handleDelete(id: string) {
    startTransition(() => { deleteCoupon(id) })
  }

  return (
    <div>
      <h1 className="font-[family-name:var(--font-dm-sans)] text-[24px] font-medium mb-6" style={{ color: c.charcoal }}>
        Coupon Codes
      </h1>

      {/* Create form */}
      <form action={handleCreate} className="rounded-[14px] p-5 mb-6" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
        <h2 className="font-[family-name:var(--font-dm-sans)] text-[15px] font-medium mb-4" style={{ color: c.charcoal }}>
          Create coupon
        </h2>

        {error && (
          <div className="rounded-[8px] px-3 py-2 mb-3 font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ background: c.errorBg, color: c.error }}>
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-[8px] px-3 py-2 mb-3 font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ background: c.greenBg, color: c.green }}>
            Coupon created!
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
              Code
            </label>
            <input
              name="code"
              required
              placeholder="e.g. AMEDI10"
              className="w-full rounded-[8px] px-3 py-2.5 text-[13px] font-[family-name:var(--font-dm-sans)] outline-none uppercase"
              style={{ border: `1px solid ${c.cream2}`, color: c.charcoal }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
              Type
            </label>
            <select
              name="discountType"
              defaultValue="percentage"
              className="w-full rounded-[8px] px-3 py-2.5 text-[13px] font-[family-name:var(--font-dm-sans)] outline-none"
              style={{ border: `1px solid ${c.cream2}`, color: c.charcoal, background: c.white }}
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed amount (IQD)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
              Discount value
            </label>
            <input
              name="discountValue"
              type="number"
              required
              min="1"
              placeholder="e.g. 10"
              className="w-full rounded-[8px] px-3 py-2.5 text-[13px] font-[family-name:var(--font-dm-sans)] outline-none"
              style={{ border: `1px solid ${c.cream2}`, color: c.charcoal }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
              Min order (IQD)
            </label>
            <input
              name="minOrder"
              type="number"
              min="0"
              defaultValue="0"
              placeholder="0 = no minimum"
              className="w-full rounded-[8px] px-3 py-2.5 text-[13px] font-[family-name:var(--font-dm-sans)] outline-none"
              style={{ border: `1px solid ${c.cream2}`, color: c.charcoal }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
              Max uses (optional)
            </label>
            <input
              name="maxUses"
              type="number"
              min="1"
              placeholder="Leave empty for unlimited"
              className="w-full rounded-[8px] px-3 py-2.5 text-[13px] font-[family-name:var(--font-dm-sans)] outline-none"
              style={{ border: `1px solid ${c.cream2}`, color: c.charcoal }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
              Expires at (optional)
            </label>
            <input
              name="expiresAt"
              type="datetime-local"
              className="w-full rounded-[8px] px-3 py-2.5 text-[13px] font-[family-name:var(--font-dm-sans)] outline-none"
              style={{ border: `1px solid ${c.cream2}`, color: c.charcoal }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[13px] font-medium border-none cursor-pointer"
          style={{ background: c.green, color: '#fff', opacity: isPending ? 0.7 : 1 }}
        >
          {isPending ? 'Creating...' : 'Create coupon'}
        </button>
      </form>

      {/* Coupon list */}
      {coupons.length === 0 ? (
        <div className="rounded-[14px] p-8 text-center" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
          <p className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.stone }}>
            No coupons yet. Create your first coupon above.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {coupons.map(coupon => {
            const cp = coupon as Coupon
            const isExpired = cp.expires_at && new Date(cp.expires_at) < new Date()

            return (
              <div key={cp.id} className="rounded-[14px] p-4 flex items-center gap-4" style={{ background: c.white, border: `1px solid ${c.cream2}`, opacity: cp.is_active && !isExpired ? 1 : 0.6 }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-[family-name:var(--font-dm-mono)] text-[14px] font-medium" style={{ color: c.charcoal }}>
                      {cp.code}
                    </span>
                    <span className="px-2 py-0.5 rounded-[4px] font-[family-name:var(--font-dm-mono)] text-[10px] font-medium" style={{
                      background: cp.is_active && !isExpired ? c.greenBg : c.terraBg,
                      color: cp.is_active && !isExpired ? c.green : c.terra,
                    }}>
                      {isExpired ? 'Expired' : cp.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <div className="font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ color: c.stone }}>
                    {cp.discount_type === 'percentage' ? `${cp.discount_value}% off` : `${cp.discount_value} IQD off`}
                    {cp.min_order > 0 && ` · Min ${cp.min_order} IQD`}
                    {cp.max_uses && ` · ${cp.uses_count}/${cp.max_uses} used`}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(cp.id, !cp.is_active)}
                    disabled={isPending}
                    className="px-3 py-1.5 rounded-[6px] font-[family-name:var(--font-dm-sans)] text-[11px] border-none cursor-pointer"
                    style={{ background: c.cream, color: c.stone }}
                  >
                    {cp.is_active ? 'Pause' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(cp.id)}
                    disabled={isPending}
                    className="px-3 py-1.5 rounded-[6px] font-[family-name:var(--font-dm-sans)] text-[11px] border-none cursor-pointer"
                    style={{ background: c.terraBg, color: c.terra }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
