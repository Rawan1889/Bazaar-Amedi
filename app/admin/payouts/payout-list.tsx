'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { markPayoutPaid, type AdminPayout } from '@/lib/bazaar/payout-actions'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
} as const

const fmt = (n: number) => new Intl.NumberFormat('en-IQ').format(n) + ' IQD'

export function PayoutList({ payouts }: { payouts: AdminPayout[] }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (payouts.length === 0) {
    return (
      <div className="rounded-[14px] p-8 text-center" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
        <p className="font-[family-name:var(--font-dm-sans)] text-[14px]" style={{ color: c.stone }}>
          No pending payout requests.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {payouts.map(p => (
        <div key={p.id} className="flex items-center justify-between gap-3 rounded-[12px] p-4" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
          <div className="flex-1 min-w-0">
            <div className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: c.charcoal }}>{p.shop_name}</div>
            <div className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>
              requested {new Date(p.requested_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
          <div className="font-[family-name:var(--font-dm-sans)] text-[16px] font-medium" style={{ color: c.green }}>
            {fmt(p.amount)}
          </div>
          <button
            onClick={() => { if (confirm(`Mark ${fmt(p.amount)} to ${p.shop_name} as paid?`)) startTransition(async () => { await markPayoutPaid(p.id); router.refresh() }) }}
            disabled={isPending}
            className="px-3 py-2 rounded-[8px] border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[12px] font-medium flex-shrink-0"
            style={{ background: c.greenBg, color: c.green, opacity: isPending ? 0.6 : 1 }}
          >
            Mark paid
          </button>
        </div>
      ))}
    </div>
  )
}
