'use server'

import { createBazaarServer } from './supabase-server'
import { getBazaarUser } from './auth'

export async function getShopAnalytics() {
  const user = await getBazaarUser()
  if (!user || user.role !== 'market_admin') return null

  const supabase = await createBazaarServer()

  const { data: shop } = await supabase
    .from('bazaar_shops')
    .select('id, name')
    .eq('owner_id', user.id)
    .single()

  if (!shop) return null

  const { data: allItems } = await supabase
    .from('bazaar_order_items')
    .select('quantity, unit_price, product_name, created_at, bazaar_orders!inner(status, created_at)')
    .eq('shop_id', shop.id)

  const items = (allItems || []) as unknown as {
    quantity: number; unit_price: number; product_name: string; created_at: string
    bazaar_orders: { status: string; created_at: string }
  }[]

  const deliveredItems = items.filter(i => i.bazaar_orders.status === 'delivered')

  const totalRevenue = deliveredItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)
  const totalOrders = new Set(items.map(() => Math.random())).size
  const totalItemsSold = deliveredItems.reduce((sum, i) => sum + i.quantity, 0)

  const { count: totalProducts } = await supabase
    .from('bazaar_products')
    .select('*', { count: 'exact', head: true })
    .eq('shop_id', shop.id)

  const { data: reviews } = await supabase
    .from('bazaar_reviews')
    .select('rating')
    .eq('shop_id', shop.id)

  const avgRating = reviews && reviews.length > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0

  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {}
  for (const item of deliveredItems) {
    const key = item.product_name
    if (!productSales[key]) productSales[key] = { name: key, quantity: 0, revenue: 0 }
    productSales[key].quantity += item.quantity
    productSales[key].revenue += item.unit_price * item.quantity
  }

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const last7Days: { date: string; revenue: number; orders: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const dayItems = deliveredItems.filter(item => {
      const itemDate = new Date(item.bazaar_orders.created_at).toISOString().split('T')[0]
      return itemDate === dateStr
    })
    last7Days.push({
      date: date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
      revenue: dayItems.reduce((s, i) => s + i.unit_price * i.quantity, 0),
      orders: new Set(dayItems.map((_, idx) => idx)).size,
    })
  }

  return {
    shopName: shop.name,
    totalRevenue,
    totalOrders: items.length,
    totalItemsSold,
    totalProducts: totalProducts || 0,
    avgRating,
    reviewCount: reviews?.length || 0,
    topProducts,
    last7Days,
  }
}
