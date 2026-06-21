export const dynamic = 'force-dynamic'
import { getBazaarUser } from '@/lib/bazaar/auth'
import { createBazaarServer } from '@/lib/bazaar/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  terra:    '#C4654A',
  terraBg:  'rgba(196,101,74,0.08)',
  saffron:  '#E8A838',
  saffronBg:'rgba(232,168,56,0.08)',
  indigo:   '#6366F1',
  indigoBg: 'rgba(99,102,241,0.08)',
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

const statusSteps = [
  { key: 'pending', label: 'Order placed', icon: '1' },
  { key: 'confirmed', label: 'Shop is preparing', icon: '2' },
  { key: 'ready', label: 'Ready — waiting for driver', icon: '3' },
  { key: 'picking_up', label: 'Driver picking up', icon: '4' },
  { key: 'delivering', label: 'On the way', icon: '5' },
  { key: 'delivered', label: 'Delivered', icon: '6' },
]

const statusIndex: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  ready: 2,
  picking_up: 3,
  delivering: 4,
  delivered: 5,
  cancelled: -1,
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getBazaarUser()
  if (!user) redirect('/login')

  const supabase = await createBazaarServer()

  const { data: order } = await supabase
    .from('bazaar_orders')
    .select('*, bazaar_order_items(*, bazaar_shops(name, slug))')
    .eq('id', id)
    .eq('customer_id', user.id)
    .single()

  if (!order) notFound()

  const o = order as {
    id: string; order_number: number; status: string; total: number; delivery_fee: number
    delivery_address: string; note: string | null; created_at: string; delivered_at: string | null
    bazaar_order_items: { id: string; product_name: string; quantity: number; unit_price: number; pickup_status: string; bazaar_shops: { name: string; slug: string } }[]
  }

  const currentStep = statusIndex[o.status] ?? 0
  const isCancelled = o.status === 'cancelled'
  const shopNames = [...new Set(o.bazaar_order_items?.map(i => i.bazaar_shops?.name))]

  return (
    <div className="min-h-[100dvh] pb-20 md:pb-0" style={{ background: c.bg }}>
      <nav className="sticky top-0 z-10 px-6 py-4" style={{ background: 'rgba(250,250,247,0.9)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${c.cream2}` }}>
        <div className="max-w-[600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="no-underline">
              <span className="font-[family-name:var(--font-dm-sans)] text-[20px] font-medium" style={{ color: c.charcoal }}>
                bazaar<span style={{ color: c.green }}>.</span>
              </span>
            </Link>
            <span style={{ color: c.cream2 }}>/</span>
            <Link href="/orders" className="font-[family-name:var(--font-dm-sans)] text-[13px] no-underline" style={{ color: c.stone }}>
              Orders
            </Link>
            <span style={{ color: c.cream2 }}>/</span>
            <span className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.stone }}>#{o.order_number}</span>
          </div>
        </div>
      </nav>

      <div className="max-w-[600px] mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-[family-name:var(--font-dm-sans)] text-[24px] font-medium" style={{ color: c.charcoal }}>
            Order #{o.order_number}
          </h1>
          <span className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.stone }}>
            {new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Status Timeline */}
        <div className="rounded-[14px] p-6 mb-6" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
          <h2 className="font-[family-name:var(--font-dm-sans)] text-[15px] font-medium mb-5" style={{ color: c.charcoal }}>
            {isCancelled ? 'Order cancelled' : 'Order tracking'}
          </h2>

          {isCancelled ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-[10px]" style={{ background: c.terraBg }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c.terra} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6M9 9l6 6" />
              </svg>
              <span className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ color: c.terra }}>
                This order has been cancelled.
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-0">
              {statusSteps.map((step, idx) => {
                const isComplete = idx <= currentStep
                const isCurrent = idx === currentStep
                const isLast = idx === statusSteps.length - 1

                return (
                  <div key={step.key} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-[family-name:var(--font-dm-sans)] text-[12px] font-medium transition-all duration-300"
                        style={{
                          background: isComplete ? c.green : c.cream,
                          color: isComplete ? '#fff' : c.stone,
                          boxShadow: isCurrent ? `0 0 0 4px ${c.greenBg}` : 'none',
                        }}
                      >
                        {isComplete && idx < currentStep ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        ) : (
                          step.icon
                        )}
                      </div>
                      {!isLast && (
                        <div
                          className="w-0.5 h-8 my-1"
                          style={{ background: idx < currentStep ? c.green : c.cream2 }}
                        />
                      )}
                    </div>
                    <div className="pt-1 pb-4">
                      <div
                        className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium"
                        style={{ color: isComplete ? c.charcoal : c.stone }}
                      >
                        {step.label}
                      </div>
                      {isCurrent && (
                        <div className="font-[family-name:var(--font-dm-mono)] text-[10px] mt-0.5" style={{ color: c.green }}>
                          Current status
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="rounded-[14px] overflow-hidden mb-6" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
          <div className="px-5 py-3" style={{ borderBottom: `1px solid ${c.cream}` }}>
            <h3 className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: c.charcoal }}>
              Items ({o.bazaar_order_items.length})
            </h3>
          </div>
          {o.bazaar_order_items.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${c.cream}` }}>
              <div className="flex-1 min-w-0">
                <div className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ color: c.charcoal }}>
                  {item.quantity}x {item.product_name}
                </div>
                <div className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>
                  {item.bazaar_shops?.name}
                  {item.pickup_status === 'picked_up' && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-[3px]" style={{ background: c.greenBg, color: c.green }}>
                      Picked up
                    </span>
                  )}
                </div>
              </div>
              <span className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.charcoal }}>
                {formatIQD(item.unit_price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="rounded-[14px] p-5" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
          <div className="flex flex-col gap-2 mb-4 pb-4" style={{ borderBottom: `1px solid ${c.cream}` }}>
            <div className="flex justify-between font-[family-name:var(--font-dm-sans)] text-[13px]">
              <span style={{ color: c.stone }}>Subtotal</span>
              <span style={{ color: c.charcoal }}>{formatIQD(o.total - o.delivery_fee)}</span>
            </div>
            <div className="flex justify-between font-[family-name:var(--font-dm-sans)] text-[13px]">
              <span style={{ color: c.stone }}>Delivery</span>
              <span style={{ color: c.charcoal }}>{formatIQD(o.delivery_fee)}</span>
            </div>
            <div className="flex justify-between font-[family-name:var(--font-dm-sans)] text-[14px] font-medium pt-2">
              <span style={{ color: c.charcoal }}>Total</span>
              <span style={{ color: c.green }}>{formatIQD(o.total)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between font-[family-name:var(--font-dm-sans)] text-[12px]">
              <span style={{ color: c.stone }}>Delivery address</span>
              <span style={{ color: c.charcoal }}>{o.delivery_address}</span>
            </div>
            <div className="flex justify-between font-[family-name:var(--font-dm-sans)] text-[12px]">
              <span style={{ color: c.stone }}>Shops</span>
              <span style={{ color: c.charcoal }}>{shopNames.join(', ')}</span>
            </div>
            {o.note && (
              <div className="flex justify-between font-[family-name:var(--font-dm-sans)] text-[12px]">
                <span style={{ color: c.stone }}>Note</span>
                <span style={{ color: c.charcoal }}>{o.note}</span>
              </div>
            )}
            <div className="flex justify-between font-[family-name:var(--font-dm-sans)] text-[12px]">
              <span style={{ color: c.stone }}>Payment</span>
              <span className="font-[family-name:var(--font-dm-mono)] text-[10px] px-1.5 py-0.5 rounded-[3px]" style={{ background: c.saffronBg, color: c.saffron }}>
                Cash on delivery
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
