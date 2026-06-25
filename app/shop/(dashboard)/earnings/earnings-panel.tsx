'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { requestPayout, type ShopEarnings, type Payout } from '@/lib/bazaar/payout-actions'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  saffron:  '#E8A838',
  saffronBg:'rgba(232,168,56,0.1)',
  terra:    '#C4654A',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
} as const

const fmt = (n: number) => new Intl.NumberFormat('en-IQ').format(n) + ' IQD'

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: c.saffron, bg: c.saffronBg },
  paid:    { label: 'Paid',    color: c.green,   bg: c.greenBg },
  rejected:{ label: 'Rejected',color: c.terra,   bg: 'rgba(196,101,74,0.08)' },
}

export function EarningsPanel({ earnings, payouts }: { earnings: ShopEarnings; payouts: Payout[] }) {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function submit() {
    const n = parseInt(amount.replace(/[^\d]/g, ''), 10)
    if (!n) { setError('Enter an amount.'); return }
    setError(null)
    startTransition(async () => {
      const res = await requestPayout(n)
      if (res.error) setError(res.error)
      else { setAmount(''); router.refresh() }
    })
  }

  const cards = [
    { label: 'Gross sales', value: earnings.gross, color: c.charcoal },
    { label: `Commission (${earnings.commissionRate}%)`, value: -earnings.commission, color: c.terra },
    { label: 'Net earnings', value: earnings.net, color: c.green },
    { label: 'Available to withdraw', value: earnings.available, color: c.green },
  ]

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map(card => (
          <div key={card.label} className="rounded-[14px] p-5" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
            <div className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase mb-2" style={{ color: c.stone }}>
              {card.label}
            </div>
            <div className="font-[family-name:var(--font-dm-sans)] text-[20px] font-medium" style={{ color: card.color }}>
              {card.value < 0 ? '−' : ''}{fmt(Math.abs(card.value))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[14px] p-5 mb-6" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
        <h3 className="font-[family-name:var(--font-dm-sans)] text-[15px] font-medium mb-1" style={{ color: c.charcoal }}>
          Request a payout
        </h3>
        <p className="font-[family-name:var(--font-dm-sans)] text-[12px] mb-3" style={{ color: c.stone }}>
          Available: {fmt(earnings.available)}. Paid out so far: {fmt(earnings.paidOut)}{earnings.pending > 0 ? ` · ${fmt(earnings.pending)} pending` : ''}.
        </p>
        <div className="flex gap-2 items-center">
          <input
            value={amount}
            onChange={e => { setAmount(e.target.value); setError(null) }}
            inputMode="numeric"
            placeholder="Amount in IQD"
            className="flex-1 max-w-[220px] px-3 py-2.5 rounded-[10px] text-[13px] font-[family-name:var(--font-dm-sans)] outline-none"
            style={{ background: c.white, color: c.charcoal, border: `1px solid ${c.cream2}` }}
          />
          <button
            onClick={submit}
            disabled={isPending || earnings.available <= 0}
            className="px-4 py-2.5 rounded-[10px] border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[13px] font-medium"
            style={{ background: c.green, color: c.white, opacity: (isPending || earnings.available <= 0) ? 0.6 : 1 }}
          >
            {isPending ? 'Requesting…' : 'Request payout'}
          </button>
        </div>
        {error && <p className="font-[family-name:var(--font-dm-sans)] text-[12px] mt-2" style={{ color: c.terra }}>{error}</p>}
      </div>

      <h3 className="font-[family-name:var(--font-dm-sans)] text-[15px] font-medium mb-2" style={{ color: c.charcoal }}>
        Payout history
      </h3>
      {payouts.length === 0 ? (
        <p className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.stone }}>No payout requests yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {payouts.map(p => {
            const st = STATUS[p.status] ?? STATUS.pending
            return (
              <div key={p.id} className="flex items-center justify-between rounded-[12px] p-3" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
                <div>
                  <div className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: c.charcoal }}>{fmt(p.amount)}</div>
                  <div className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>
                    {new Date(p.requested_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-[4px] font-[family-name:var(--font-dm-mono)] text-[10px] font-medium" style={{ background: st.bg, color: st.color }}>
                  {st.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
