export const dynamic = 'force-dynamic'
import { getPendingPayouts } from '@/lib/bazaar/payout-actions'
import { PayoutList } from './payout-list'

export default async function AdminPayoutsPage() {
  const payouts = await getPendingPayouts()
  const total = payouts.reduce((s, p) => s + p.amount, 0)

  return (
    <div>
      <h1 className="font-[family-name:var(--font-dm-sans)] text-[24px] font-medium mb-1" style={{ color: '#1E1C19' }}>
        Payout requests
      </h1>
      <p className="font-[family-name:var(--font-dm-sans)] text-[14px] mb-6" style={{ color: '#7A756E' }}>
        Pending withdrawal requests from shops.
        {total > 0 && ` Outstanding: ${new Intl.NumberFormat('en-IQ').format(total)} IQD.`}
      </p>
      <PayoutList payouts={payouts} />
    </div>
  )
}
