export const dynamic = 'force-dynamic'
import { getAllOrders } from '@/lib/bazaar/admin-actions'
import { OrderList } from './order-list'

const c = {
  charcoal: '#1E1C19',
  stone:    '#7A756E',
} as const

export default async function AdminOrdersPage() {
  const orders = await getAllOrders()

  return (
    <div>
      <h1 className="font-[family-name:var(--font-dm-sans)] text-[24px] font-medium mb-1" style={{ color: c.charcoal }}>
        All Orders
      </h1>
      <p className="font-[family-name:var(--font-dm-sans)] text-[14px] mb-6" style={{ color: c.stone }}>
        {orders.length} order{orders.length !== 1 ? 's' : ''} across all shops
      </p>
      <OrderList orders={orders as Parameters<typeof OrderList>[0]['orders']} />
    </div>
  )
}
