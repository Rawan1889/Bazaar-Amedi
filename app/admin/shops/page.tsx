export const dynamic = 'force-dynamic'
import { getAllShops } from '@/lib/bazaar/admin-actions'
import { SUBSCRIPTION_TIERS, subscriptionStatus } from '@/lib/bazaar/subscription'
import { ShopList } from './shop-list'

const fmt = (n: number) => new Intl.NumberFormat('en-IQ').format(n)

export default async function AdminShopsPage() {
  const shops = await getAllShops()
  const now = Date.now()

  const pending = shops.filter(s => !s.is_approved)
  const withState = shops
    .filter(s => s.is_approved)
    .map(s => ({ shop: s, state: subscriptionStatus(s, now).state }))
  // Unpaid shops that are still live need a decision first.
  const needsAction = (x: (typeof withState)[number]) => x.state === 'overdue' && !x.shop.is_paused
  const approved = [...withState.filter(needsAction), ...withState.filter(x => !needsAction(x))].map(x => x.shop)

  const counts = [
    { label: 'on free month', n: withState.filter(x => x.state === 'trial').length },
    { label: 'paid', n: withState.filter(x => x.state === 'paid').length },
    { label: 'payment due', n: withState.filter(needsAction).length },
    { label: 'paused', n: withState.filter(x => x.shop.is_paused).length },
  ]

  return (
    <div>
      <h1 className="font-[family-name:var(--font-dm-sans)] text-[28px] font-medium mb-1" style={{ color: '#1E1C19' }}>
        Shops
      </h1>
      <p className="font-[family-name:var(--font-dm-sans)] text-[14px] mb-2" style={{ color: '#716C66' }}>
        {shops.length} total, {pending.length} pending approval
      </p>
      <p className="font-[family-name:var(--font-dm-sans)] text-[13px] mb-1 max-w-[70ch]" style={{ color: '#716C66' }}>
        <span>Every shop gets its first month free.</span>{' '}
        <span>Then each month:</span>{' '}
        {SUBSCRIPTION_TIERS.map((t, i) => (
          <span key={t.upTo}>
            {i > 0 && ' · '}
            <span className="tabular-nums">{fmt(t.price)}</span> IQD <span>up to</span> <span className="tabular-nums">{t.upTo}</span> <span>products</span>
          </span>
        ))}
      </p>
      <p className="font-[family-name:var(--font-dm-mono)] text-[11px] mb-8" style={{ color: '#716C66' }}>
        {counts.map((c, i) => (
          <span key={c.label}>
            {i > 0 && ' · '}
            <span className="tabular-nums" style={{ color: c.label === 'payment due' && c.n > 0 ? '#A8563F' : undefined }}>{c.n}</span> <span>{c.label}</span>
          </span>
        ))}
      </p>

      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="font-[family-name:var(--font-dm-sans)] text-[18px] font-medium mb-4" style={{ color: '#1E1C19' }}>
            Pending Approval
          </h2>
          <ShopList shops={pending} showActions now={now} />
        </div>
      )}

      {approved.length > 0 && (
        <div>
          <h2 className="font-[family-name:var(--font-dm-sans)] text-[18px] font-medium mb-4" style={{ color: '#1E1C19' }}>
            Approved Shops
          </h2>
          <ShopList shops={approved} showActions={false} now={now} />
        </div>
      )}
    </div>
  )
}
