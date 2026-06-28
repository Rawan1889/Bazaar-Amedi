export const dynamic = 'force-dynamic'
import { getBazaarUser } from '@/lib/bazaar/auth'
import { getShopOrders } from '@/lib/bazaar/order-actions'
import { redirect } from 'next/navigation'
import { createBazaarServer } from '@/lib/bazaar/supabase-server'
import { ShopOrderList } from './shop-order-list'
import { ShopOrdersRefresher } from '@/app/components/shop-orders-refresher'

export default async function ShopOrdersPage() {
  const user = await getBazaarUser()
  if (!user) redirect('/login')

  const supabase = await createBazaarServer()
  const { data: shop } = await supabase
    .from('bazaar_shops')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  const orderItems = await getShopOrders()

  const groupedByOrder = orderItems.reduce((acc: Record<string, { order: Record<string, unknown>; items: typeof orderItems }>, item: Record<string, unknown>) => {
    const order = item.bazaar_orders as Record<string, unknown> | null
    if (!order?.id) return acc   // guard: skip orphaned items with no order data
    const orderId = order.id as string
    if (!acc[orderId]) {
      acc[orderId] = { order, items: [] }
    }
    acc[orderId].items.push(item)
    return acc
  }, {})

  const orders = Object.values(groupedByOrder) as { order: Record<string, unknown>; items: Record<string, unknown>[] }[]

  // Sort: active (non-delivered) first, newest first within each group
  const active = orders.filter(g => !['delivered', 'cancelled'].includes(g.order.status as string))
  const past   = orders.filter(g =>  ['delivered', 'cancelled'].includes(g.order.status as string))
  const sorted = [...active, ...past]

  return (
    <div>
      {shop && <ShopOrdersRefresher shopId={shop.id} />}

      <h1 className="font-[family-name:var(--font-dm-sans)] text-[28px] font-medium mb-1" style={{ color: '#1E1C19' }}>
        Orders
      </h1>
      <p className="font-[family-name:var(--font-dm-sans)] text-[14px] mb-8" style={{ color: '#7A756E' }}>
        {active.length} active · {past.length} past
      </p>

      <ShopOrderList orders={sorted} userId={user.id} />
    </div>
  )
}
