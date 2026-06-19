import { getMyOrders } from '@/lib/bazaar/order-actions'
import { getBazaarUser } from '@/lib/bazaar/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { OrderList } from './order-list'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  terra:    '#C4654A',
  terraBg:  'rgba(196,101,74,0.08)',
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

const statusColors: Record<string, { color: string; bg: string; label: string }> = {
  pending:     { color: c.saffron, bg: c.saffronBg, label: 'Pending' },
  confirmed:   { color: c.green, bg: c.greenBg, label: 'Confirmed' },
  picking_up:  { color: '#6366F1', bg: 'rgba(99,102,241,0.08)', label: 'Picking up' },
  delivering:  { color: '#6366F1', bg: 'rgba(99,102,241,0.08)', label: 'On the way' },
  delivered:   { color: c.green, bg: c.greenBg, label: 'Delivered' },
  cancelled:   { color: c.terra, bg: c.terraBg, label: 'Cancelled' },
}

export default async function OrdersPage() {
  const user = await getBazaarUser()
  if (!user) redirect('/login')

  const orders = await getMyOrders()

  return (
    <div className="min-h-[100dvh]" style={{ background: c.bg }}>
      <nav className="sticky top-0 z-10 px-6 py-4" style={{ background: 'rgba(250,250,247,0.9)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${c.cream2}` }}>
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="no-underline">
              <span className="font-[family-name:var(--font-dm-sans)] text-[20px] font-medium" style={{ color: c.charcoal }}>
                bazaar<span style={{ color: c.green }}>.</span>
              </span>
            </Link>
            <span style={{ color: c.cream2 }}>/</span>
            <span className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.stone }}>My Orders</span>
          </div>
          <Link href="/browse" className="font-[family-name:var(--font-dm-sans)] text-[13px] no-underline" style={{ color: c.green }}>
            Browse
          </Link>
        </div>
      </nav>

      <div className="max-w-[800px] mx-auto px-6 py-8">
        <h1 className="font-[family-name:var(--font-dm-sans)] text-[28px] font-medium mb-6" style={{ color: c.charcoal }}>
          My Orders
        </h1>

        <OrderList orders={orders} />
      </div>
    </div>
  )
}
