export const dynamic = 'force-dynamic'
import { getShopEarnings, getMyPayouts } from '@/lib/bazaar/payout-actions'
import { redirect } from 'next/navigation'
import { EarningsPanel } from './earnings-panel'

export default async function ShopEarningsPage() {
  const earnings = await getShopEarnings()
  if (!earnings) redirect('/shop')
  const payouts = await getMyPayouts()

  return (
    <div>
      <h1 className="font-[family-name:var(--font-dm-sans)] text-[28px] font-medium mb-1" style={{ color: '#1E1C19' }}>
        Earnings
      </h1>
      <p className="font-[family-name:var(--font-dm-sans)] text-[14px] mb-6" style={{ color: '#7A756E' }}>
        From delivered orders. The platform commission is {earnings.commissionRate}%.
      </p>
      <EarningsPanel earnings={earnings} payouts={payouts} />
    </div>
  )
}
