'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { settleDriverCash, type DriverCash } from '@/lib/bazaar/cash-actions'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
} as const

const fmt = (n: number) => new Intl.NumberFormat('en-IQ').format(n) + ' IQD'

export function CashList({ drivers }: { drivers: DriverCash[] }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (drivers.length === 0) {
    return (
      <div className="rounded-[14px] p-8 text-center" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
        <p className="font-[family-name:var(--font-dm-sans)] text-[14px]" style={{ color: c.stone }}>
          No outstanding cash. All drivers are settled up.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {drivers.map(d => (
        <div key={d.driver_id} className="flex items-center justify-between gap-3 rounded-[12px] p-4" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
          <div className="flex-1 min-w-0">
            <div className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: c.charcoal }}>{d.full_name}</div>
            <div className="font-[family-name:var(--font-dm-mono)] text-[11px]" style={{ color: c.stone }}>
              {d.phone} · {d.orders} order{d.orders !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="font-[family-name:var(--font-dm-sans)] text-[16px] font-medium" style={{ color: c.green }}>
            {fmt(d.amount)}
          </div>
          <button
            onClick={() => { if (confirm(`Mark ${fmt(d.amount)} from ${d.full_name} as remitted?`)) startTransition(async () => { await settleDriverCash(d.driver_id); router.refresh() }) }}
            disabled={isPending}
            className="px-3 py-2 rounded-[8px] border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[12px] font-medium flex-shrink-0"
            style={{ background: c.greenBg, color: c.green, opacity: isPending ? 0.6 : 1 }}
          >
            Mark remitted
          </button>
        </div>
      ))}
    </div>
  )
}
