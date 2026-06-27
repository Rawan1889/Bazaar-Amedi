export const dynamic = 'force-dynamic'
import { getBazaarUser } from '@/lib/bazaar/auth'
import { redirect } from 'next/navigation'
import { createBazaarServer } from '@/lib/bazaar/supabase-server'
import { getMyCashToRemit } from '@/lib/bazaar/cash-actions'
import { DriverNav } from '@/app/components/driver-nav'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  saffron:  '#E8A838',
  saffronBg:'rgba(232,168,56,0.08)',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  bg:       '#FAFAF7',
  white:    '#FFFFFF',
} as const

function formatIQD(amount: number) {
  return new Intl.NumberFormat('en-IQ').format(amount) + ' IQD'
}

export default async function DriverEarningsPage() {
  const user = await getBazaarUser()
  if (!user) redirect('/login')
  if (user.role !== 'driver' && user.role !== 'super_admin') redirect('/')

  const supabase = await createBazaarServer()

  const { data: deliveries } = await supabase
    .from('bazaar_orders')
    .select('id, order_number, delivery_fee, total, status, created_at, delivered_at, delivery_address')
    .eq('driver_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const allDeliveries = deliveries || []
  const completedDeliveries = allDeliveries.filter(d => d.status === 'delivered')
  const totalEarnings = completedDeliveries.reduce((sum, d) => sum + d.delivery_fee, 0)
  const totalDelivered = completedDeliveries.length
  const activeDeliveries = allDeliveries.filter(d => ['confirmed', 'picking_up', 'delivering'].includes(d.status))

  const today = new Date().toISOString().split('T')[0]
  const todayDeliveries = completedDeliveries.filter(d => d.delivered_at?.startsWith(today))
  const todayEarnings = todayDeliveries.reduce((sum, d) => sum + d.delivery_fee, 0)

  const cash = await getMyCashToRemit()

  return (
    <div className="min-h-[100dvh] pb-20 md:pb-0" style={{ background: c.bg }}>
      <DriverNav userName={user.full_name} />

      <div className="max-w-[800px] mx-auto px-6 py-8">
        <h1 className="font-[family-name:var(--font-dm-sans)] text-[24px] font-medium mb-6" style={{ color: c.charcoal }}>
          Earnings
        </h1>

        {/* Cash to remit */}
        {cash.amount > 0 && (
          <div className="rounded-[14px] p-5 mb-6 flex items-center justify-between" style={{ background: c.saffronBg, border: `1px solid ${c.saffron}` }}>
            <div>
              <div className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: c.charcoal }}>
                Cash to remit
              </div>
              <div className="font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ color: c.stone }}>
                COD collected from {cash.orders} order{cash.orders !== 1 ? 's' : ''} — hand in to the office
              </div>
            </div>
            <div className="font-[family-name:var(--font-dm-sans)] text-[22px] font-medium" style={{ color: c.saffron }}>
              {formatIQD(cash.amount)}
            </div>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-[14px] p-5" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
            <div className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase mb-2" style={{ color: c.stone }}>
              Total earned
            </div>
            <div className="font-[family-name:var(--font-dm-sans)] text-[22px] font-medium" style={{ color: c.green }}>
              {formatIQD(totalEarnings)}
            </div>
          </div>
          <div className="rounded-[14px] p-5" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
            <div className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase mb-2" style={{ color: c.stone }}>
              Today
            </div>
            <div className="font-[family-name:var(--font-dm-sans)] text-[22px] font-medium" style={{ color: c.saffron }}>
              {formatIQD(todayEarnings)}
            </div>
            <div className="font-[family-name:var(--font-dm-sans)] text-[11px]" style={{ color: c.stone }}>
              {todayDeliveries.length} deliver{todayDeliveries.length !== 1 ? 'ies' : 'y'}
            </div>
          </div>
          <div className="rounded-[14px] p-5" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
            <div className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase mb-2" style={{ color: c.stone }}>
              Completed
            </div>
            <div className="font-[family-name:var(--font-dm-sans)] text-[22px] font-medium" style={{ color: c.charcoal }}>
              {totalDelivered}
            </div>
          </div>
          <div className="rounded-[14px] p-5" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
            <div className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase mb-2" style={{ color: c.stone }}>
              Active
            </div>
            <div className="font-[family-name:var(--font-dm-sans)] text-[22px] font-medium" style={{ color: c.charcoal }}>
              {activeDeliveries.length}
            </div>
          </div>
        </div>

        {/* Delivery history */}
        <h2 className="font-[family-name:var(--font-dm-sans)] text-[16px] font-medium mb-4" style={{ color: c.charcoal }}>
          Delivery history
        </h2>

        {allDeliveries.length === 0 ? (
          <div className="rounded-[14px] p-8 text-center" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
            <p className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.stone }}>
              No deliveries yet. Accept orders from the dashboard to start earning.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {allDeliveries.map(d => {
              const isComplete = d.status === 'delivered'
              return (
                <div key={d.id} className="rounded-[14px] p-4 flex items-center justify-between" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ color: c.charcoal }}>
                        Order #{d.order_number}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-[4px] font-[family-name:var(--font-dm-mono)] text-[10px] font-medium"
                        style={{
                          background: isComplete ? c.greenBg : c.saffronBg,
                          color: isComplete ? c.green : c.saffron,
                        }}
                      >
                        {isComplete ? 'Delivered' : d.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="font-[family-name:var(--font-dm-sans)] text-[11px]" style={{ color: c.stone }}>
                      {d.delivery_address}
                    </div>
                    <div className="font-[family-name:var(--font-dm-mono)] text-[10px] mt-1" style={{ color: c.stone }}>
                      {new Date(d.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      {d.delivered_at && ` — delivered ${new Date(d.delivered_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: isComplete ? c.green : c.stone }}>
                      {formatIQD(d.delivery_fee)}
                    </div>
                    <div className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>
                      fee
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
