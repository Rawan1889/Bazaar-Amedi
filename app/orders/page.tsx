export const dynamic = 'force-dynamic'
import { getMyOrders } from '@/lib/bazaar/order-actions'
import { getBazaarUser } from '@/lib/bazaar/auth'
import { redirect } from 'next/navigation'
import { CustomerNav } from '@/app/components/customer-nav'
import { MobileNav } from '@/app/components/mobile-nav'
import { OrderList } from './order-list'

const c = {
  green:    '#2D8A5E',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  bg:       '#FAFAF7',
} as const

export default async function OrdersPage() {
  const user = await getBazaarUser()
  if (!user) redirect('/login')

  const orders = await getMyOrders()

  return (
    <div className="min-h-[100dvh] pb-20 md:pb-0" style={{ background: c.bg }}>
      <CustomerNav />

      <div className="max-w-[800px] mx-auto px-6 py-8">
        <h1 className="font-[family-name:var(--font-dm-sans)] text-[28px] font-medium mb-6" style={{ color: c.charcoal }}>
          My Orders
        </h1>
        <OrderList orders={orders} />
      </div>

      <MobileNav />
    </div>
  )
}
