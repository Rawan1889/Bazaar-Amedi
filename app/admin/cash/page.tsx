export const dynamic = 'force-dynamic'
import { getDriversCashSummary } from '@/lib/bazaar/cash-actions'
import { CashList } from './cash-list'

export default async function AdminCashPage() {
  const drivers = await getDriversCashSummary()
  const total = drivers.reduce((s, d) => s + d.amount, 0)

  return (
    <div>
      <h1 className="font-[family-name:var(--font-dm-sans)] text-[24px] font-medium mb-1" style={{ color: '#1E1C19' }}>
        Driver cash
      </h1>
      <p className="font-[family-name:var(--font-dm-sans)] text-[14px] mb-6" style={{ color: '#7A756E' }}>
        Cash-on-delivery collected by drivers and not yet remitted to the office.
        {total > 0 && ` Outstanding: ${new Intl.NumberFormat('en-IQ').format(total)} IQD.`}
      </p>
      <CashList drivers={drivers} />
    </div>
  )
}
