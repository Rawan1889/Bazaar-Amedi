export const dynamic = 'force-dynamic'
import { getBazaarUser } from '@/lib/bazaar/auth'
import { redirect } from 'next/navigation'
import { getAvailableOrders, getMyDeliveries } from '@/lib/bazaar/order-actions'
import { DriverOrderList } from './driver-orders'
import { DriverLocationBroadcaster } from '@/app/components/driver-location-broadcaster'
import Link from 'next/link'

export default async function DriverDashboard() {
  const user = await getBazaarUser()
  if (!user) redirect('/login')
  if (user.role !== 'driver' && user.role !== 'super_admin') redirect('/')

  // Driver signed up but not yet approved by admin
  if (user.role === 'driver' && !user.is_approved) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6" style={{ background: '#FAFAF7' }}>
        <div className="max-w-[400px] w-full text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(232,168,56,0.1)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E8A838" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <h1 className="font-[family-name:var(--font-dm-sans)] text-[24px] font-medium mb-3" style={{ color: '#1E1C19' }}>
            Pending approval
          </h1>
          <p className="font-[family-name:var(--font-dm-sans)] text-[14px] mb-6" style={{ color: '#7A756E' }}>
            Your driver account is under review. We'll notify you once an admin approves your account — usually within 24 hours.
          </p>
          <p className="font-[family-name:var(--font-dm-mono)] text-[11px]" style={{ color: '#9A958E' }}>
            Signed in as {user.full_name}
          </p>
        </div>
      </div>
    )
  }

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

        <DriverLocationBroadcaster active={active.length > 0} />

        <DriverOrderList active={active} available={available} userId={user.id} />
      </div>
    </div>
  )
}
