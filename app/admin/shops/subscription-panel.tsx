'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useDialog } from '@/app/components/dialog-provider'
import { recordSubscriptionPayment, setShopPaused } from '@/lib/bazaar/subscription-actions'
import { monthlyFee, nextPeriod, subscriptionStatus, tierLabel } from '@/lib/bazaar/subscription'

const c = {
  green:     '#287A53',
  greenBg:   'rgba(45,138,94,0.08)',
  saffronText: '#8D6514',
  saffronBg: 'rgba(232,168,56,0.12)',
  terra:     '#A8563F',
  terraBg:   'rgba(196,101,74,0.08)',
  charcoal:  '#1E1C19',
  stone:     '#716C66',
  cream:     '#F7F5F1',
  cream2:    '#E8E4DE',
  white:     '#FFFFFF',
} as const

export interface SubscriptionShopRow {
  id: string
  name: string
  trial_ends_at: string | null
  paid_until: string | null
  is_paused: boolean | null
  product_count: number
  last_payment: { amount: number; created_at: string } | null
}

const fmt = (n: number) => new Intl.NumberFormat('en-IQ').format(n)
const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Baghdad' })

export function SubscriptionPanel({ shop, now }: { shop: SubscriptionShopRow; now: number }) {
  const dialog = useDialog()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const status = subscriptionStatus(shop, now)
  const fee = monthlyFee(shop.product_count)
  const paused = !!shop.is_paused

  const chip =
    status.state === 'trial' ? { label: 'Free month', color: c.saffronText, bg: c.saffronBg }
    : status.state === 'paid' ? { label: 'Paid', color: c.green, bg: c.greenBg }
    : { label: 'Payment due', color: c.terra, bg: c.terraBg }

  async function recordPayment() {
    const { end } = nextPeriod(shop, Date.now(), 1)
    const ok = await dialog.confirm({
      title: 'Record payment?',
      message: `${shop.name} paid ${fmt(fee)} IQD for 1 month (${shop.product_count} ${shop.product_count === 1 ? 'product' : 'products'}). Paid until ${day(end.toISOString())}.${paused ? ' The shop will be unpaused.' : ''}`,
      confirmLabel: 'Record payment',
    })
    if (!ok) return
    startTransition(async () => {
      const res = await recordSubscriptionPayment(shop.id, 1)
      if (res.error) await dialog.alert({ title: 'Could not record payment', message: res.error })
      router.refresh()
    })
  }

  async function togglePause() {
    const ok = await dialog.confirm(paused
      ? { title: 'Unpause shop?', message: `${shop.name} will be visible to customers again.`, confirmLabel: 'Unpause' }
      : { title: 'Pause shop?', message: `${shop.name} will be hidden from customers and can't receive new orders until you unpause it or record a payment.`, confirmLabel: 'Pause shop', tone: 'danger' })
    if (!ok) return
    startTransition(async () => {
      const res = await setShopPaused(shop.id, !paused)
      if (res.error) await dialog.alert({ title: 'Could not update shop', message: res.error })
      router.refresh()
    })
  }

  return (
    <div className="rounded-[10px] p-3 mb-3" style={{ background: c.cream, border: `1px solid ${c.cream2}` }}>
      <div className="flex items-center flex-wrap gap-2 mb-1.5">
        <span className="font-[family-name:var(--font-dm-mono)] text-[9px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
          Subscription
        </span>
        <span className="px-2 py-0.5 rounded-[4px] font-[family-name:var(--font-dm-mono)] text-[10px] font-medium" style={{ background: chip.bg, color: chip.color }}>
          {chip.label}
        </span>
        {paused && (
          <span className="px-2 py-0.5 rounded-[4px] font-[family-name:var(--font-dm-mono)] text-[10px] font-medium" style={{ background: c.charcoal, color: c.white }}>
            Paused
          </span>
        )}
      </div>

      <div className="font-[family-name:var(--font-dm-sans)] text-[13px] mb-1" style={{ color: c.charcoal }}>
        {status.state === 'overdue' ? (
          status.daysOverdue === 0
            ? <><span>Due today</span> · <span>since</span> {day(status.since)}</>
            : <><span className="tabular-nums">{status.daysOverdue}</span> <span>{status.daysOverdue === 1 ? 'day overdue' : 'days overdue'}</span> · <span>since</span> {day(status.since)}</>
        ) : (
          <><span className="tabular-nums">{status.daysLeft}</span> <span>{status.daysLeft === 1 ? 'day left' : 'days left'}</span> · <span>until</span> {day(status.until)}</>
        )}
        {status.state === 'trial' && status.paidUntil && (
          <> · <span>paid until</span> {day(status.paidUntil)}</>
        )}
      </div>

      <div className="font-[family-name:var(--font-dm-mono)] text-[11px] mb-1" style={{ color: c.stone }}>
        <span className="tabular-nums">{shop.product_count}</span> <span>{shop.product_count === 1 ? 'product' : 'products'}</span> · <span>{tierLabel(shop.product_count)}</span> · <span className="tabular-nums">{fmt(fee)}</span> <span>IQD / month</span>
      </div>
      {shop.last_payment && (
        <div className="font-[family-name:var(--font-dm-mono)] text-[11px]" style={{ color: c.stone }}>
          <span>Last payment</span> <span className="tabular-nums">{fmt(shop.last_payment.amount)}</span> <span>IQD</span> · {day(shop.last_payment.created_at)}
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <button
          onClick={recordPayment}
          disabled={isPending}
          className="flex-1 py-2 rounded-[8px] border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[12px] font-medium"
          style={{ background: c.green, color: c.white, opacity: isPending ? 0.6 : 1 }}
        >
          Record payment
        </button>
        <button
          onClick={togglePause}
          disabled={isPending}
          className="flex-1 py-2 rounded-[8px] cursor-pointer font-[family-name:var(--font-dm-sans)] text-[12px] font-medium"
          style={paused
            ? { background: c.white, color: c.charcoal, border: `1px solid ${c.cream2}`, opacity: isPending ? 0.6 : 1 }
            : { background: c.terraBg, color: c.terra, border: 'none', opacity: isPending ? 0.6 : 1 }}
        >
          {paused ? 'Unpause' : 'Pause shop'}
        </button>
      </div>
    </div>
  )
}
