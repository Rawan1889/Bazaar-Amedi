'use client'

import { useTransition } from 'react'
import { adminCancelOrder, adminSetOrderStatus } from '@/lib/bazaar/admin-actions'

const c = {
  green:  '#2D8A5E',
  greenBg:'rgba(45,138,94,0.08)',
  terra:  '#C4654A',
  terraBg:'rgba(196,101,74,0.08)',
  stone:  '#7A756E',
  cream2: '#E8E4DE',
  white:  '#FFFFFF',
} as const

const STATUSES = ['pending','confirmed','picking_up','delivering','delivered','cancelled']

export function OrderActions({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [pending, startTransition] = useTransition()

  if (currentStatus === 'cancelled' || currentStatus === 'delivered') {
    return <span className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>—</span>
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        defaultValue={currentStatus}
        disabled={pending}
        onChange={e => startTransition(() => adminSetOrderStatus(orderId, e.target.value))}
        className="px-2 py-1.5 rounded-[6px] font-[family-name:var(--font-dm-sans)] text-[11px] border cursor-pointer outline-none capitalize"
        style={{ borderColor: c.cream2, color: c.stone, background: c.white, opacity: pending ? 0.6 : 1 }}
      >
        {STATUSES.filter(s => s !== 'cancelled').map(s => (
          <option key={s} value={s}>{s.replace('_', ' ')}</option>
        ))}
      </select>
      <button
        disabled={pending}
        onClick={() => startTransition(() => adminCancelOrder(orderId))}
        className="px-3 py-1.5 rounded-[6px] font-[family-name:var(--font-dm-sans)] text-[11px] font-medium border-none cursor-pointer"
        style={{ background: c.terraBg, color: c.terra, opacity: pending ? 0.6 : 1 }}
      >
        Cancel
      </button>
    </div>
  )
}

const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'picking_up', 'delivering', 'delivered', 'cancelled']

export function OrderFilters({
  active,
  counts,
  onChange,
}: {
  active: string
  counts: Record<string, number>
  onChange: (v: string) => void
}) {
  return (
    <div className="flex gap-2 flex-wrap mb-4">
      {STATUS_FILTERS.map(s => {
        const count = s === 'all' ? Object.values(counts).reduce((a, b) => a + b, 0) : (counts[s] ?? 0)
        const isActive = active === s
        return (
          <button
            key={s}
            onClick={() => onChange(s)}
            className="px-3 py-1.5 rounded-[8px] font-[family-name:var(--font-dm-sans)] text-[12px] border-none cursor-pointer capitalize transition-all duration-150"
            style={{
              background: isActive ? c.green : 'rgba(30,28,25,0.05)',
              color: isActive ? '#fff' : c.stone,
              fontWeight: isActive ? 500 : 400,
            }}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ')} ({count})
          </button>
        )
      })}
    </div>
  )
}
