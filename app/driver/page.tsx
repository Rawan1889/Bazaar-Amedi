import { getBazaarUser } from '@/lib/bazaar/auth'
import { redirect } from 'next/navigation'
import { getAvailableOrders, getMyDeliveries } from '@/lib/bazaar/order-actions'
import { DriverOrderList } from './driver-orders'
import Link from 'next/link'

export default async function DriverDashboard() {
  const user = await getBazaarUser()
  if (!user) redirect('/login')
  if (user.role !== 'driver' && user.role !== 'super_admin') redirect('/')

  const available = await getAvailableOrders()
  const active = await getMyDeliveries()

  return (
    <div className="min-h-[100dvh]" style={{ background: '#FAFAF7' }}>
      <nav className="sticky top-0 z-10 px-6 py-4" style={{ background: 'rgba(250,250,247,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E8E4DE' }}>
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-[family-name:var(--font-dm-sans)] text-[20px] font-medium" style={{ color: '#1E1C19' }}>
              bazaar<span style={{ color: '#2D8A5E' }}>.</span>
            </span>
            <span className="font-[family-name:var(--font-dm-mono)] text-[10px] px-2 py-0.5 rounded-[4px]" style={{ background: 'rgba(45,138,94,0.08)', color: '#2D8A5E' }}>
              Driver
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/driver/earnings" className="font-[family-name:var(--font-dm-sans)] text-[13px] no-underline" style={{ color: '#2D8A5E' }}>
              Earnings
            </Link>
            <span className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: '#7A756E' }}>
              {user.full_name}
            </span>
          </div>
        </div>
      </nav>

      <div className="max-w-[800px] mx-auto px-6 py-8">
        <h1 className="font-[family-name:var(--font-dm-sans)] text-[28px] font-medium mb-1" style={{ color: '#1E1C19' }}>
          Deliveries
        </h1>
        <p className="font-[family-name:var(--font-dm-sans)] text-[14px] mb-8" style={{ color: '#7A756E' }}>
          {active.length} active, {available.length} available
        </p>

        <DriverOrderList active={active} available={available} />
      </div>
    </div>
  )
}
