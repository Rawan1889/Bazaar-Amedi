export const dynamic = 'force-dynamic'
import { getBazaarUser } from '@/lib/bazaar/auth'
import { getShopOrders } from '@/lib/bazaar/order-actions'
import { redirect } from 'next/navigation'
import { ShopOrderList } from './shop-order-list'

export default async function ShopOrdersPage() {
  const user = await getBazaarUser()
  if (!user) redirect('/login')

  const orderItems = await getShopOrders()

  const groupedByOrder = orderItems.reduce((acc: Record<string, { order: Record<string, unknown>; items: typeof orderItems }>, item: Record<string, unknown>) => {
    const order = item.bazaar_orders as Record<string, unknown>
    const orderId = order.id as string
    if (!acc[orderId]) {
      acc[orderId] = { order, items: [] }
    }
    acc[orderId].items.push(item)
    return acc
  }, {})

  const orders = Object.values(groupedByOrder) as { order: Record<string, unknown>; items: Record<string, unknown>[] }[]

  return (
    <div>
      <h1 className="font-[family-name:var(--font-dm-sans)] text-[28px] font-medium mb-1" style={{ color: '#1E1C19' }}>
        Orders
      </h1>
      <p className="font-[family-name:var(--font-dm-sans)] text-[14px] mb-8" style={{ color: '#7A756E' }}>
        {orders.length} order{orders.length !== 1 ? 's' : ''} for your shop
      </p>

      <ShopOrderList orders={orders} />
    </div>
  )
}
