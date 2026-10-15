import { monthlyFee, subscriptionStatus } from '@/lib/bazaar/subscription'

const c = {
  green:       '#287A53',
  greenBg:     'rgba(45,138,94,0.08)',
  saffron:     '#E8A838',
  saffronText: '#8D6514',
  saffronBg:   'rgba(232,168,56,0.10)',
  terra:       '#A8563F',
  terraBg:     'rgba(196,101,74,0.08)',
  charcoal:    '#1E1C19',
  stone:       '#716C66',
} as const

const fmt = (n: number) => new Intl.NumberFormat('en-IQ').format(n)
// Numeric so it reads the same in every language.
const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Baghdad' })

export function SubscriptionNotice({
  shop,
  productCount,
}: {
  shop: { trial_ends_at: string | null; paid_until: string | null; is_paused: boolean | null }
  productCount: number
}) {
  const status = subscriptionStatus(shop, Date.now())
  const fee = monthlyFee(productCount)

  const tone = shop.is_paused || status.state === 'overdue'
    ? { color: c.terra, bg: c.terraBg, border: 'rgba(196,101,74,0.18)' }
    : status.state === 'trial'
      ? { color: c.saffronText, bg: c.saffronBg, border: 'rgba(232,168,56,0.2)' }
      : { color: c.green, bg: c.greenBg, border: 'rgba(45,138,94,0.15)' }

  return (
    <div className="rounded-[14px] p-5 mb-6" style={{ background: tone.bg, border: `1px solid ${tone.border}` }}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="font-[family-name:var(--font-dm-sans)] text-[15px] font-medium mb-1" style={{ color: c.charcoal }}>
            {shop.is_paused ? 'Your shop is paused'
              : status.state === 'trial' ? 'Free month'
              : status.state === 'paid' ? 'Subscription paid'
              : 'Subscription payment due'}
          </div>
          <p className="font-[family-name:var(--font-dm-sans)] text-[13px] max-w-[60ch]" style={{ color: c.stone }}>
            {shop.is_paused
              ? "Customers can't see your shop or order from it until your subscription is paid. Contact Kela to renew."
              : status.state === 'trial'
                ? 'Your first month on Kela is free. After that, you pay a monthly fee based on how many products you list.'
                : status.state === 'paid'
                  ? 'Thank you. Your shop is visible to customers.'
                  : 'Your shop may be paused soon. Pay your monthly fee to Kela to keep it visible to customers.'}
          </p>
          <div className="font-[family-name:var(--font-dm-mono)] text-[11px] mt-2" style={{ color: c.stone }}>
            <span className="tabular-nums">{fmt(fee)}</span> IQD <span>/ month</span> · <span className="tabular-nums">{productCount}</span> <span>{productCount === 1 ? 'product' : 'products'}</span>
          </div>
        </div>
        {!shop.is_paused && status.state !== 'overdue' && (
          <div className="text-end flex-shrink-0">
            <div className="font-[family-name:var(--font-dm-sans)] text-[24px] font-medium tabular-nums leading-none" style={{ color: tone.color }}>
              {status.daysLeft}
            </div>
            <div className="font-[family-name:var(--font-dm-mono)] text-[10px] mt-1" style={{ color: c.stone }}>
              <span>{status.daysLeft === 1 ? 'day left' : 'days left'}</span>
            </div>
            <div className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>
              <span>until</span> {day(status.until)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
