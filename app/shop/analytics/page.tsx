export const dynamic = 'force-dynamic'
import { getShopAnalytics } from '@/lib/bazaar/analytics-actions'
import { redirect } from 'next/navigation'
import { AnalyticsDashboard } from './analytics-dashboard'

export default async function AnalyticsPage() {
  const data = await getShopAnalytics()
  if (!data) redirect('/shop')

  return <AnalyticsDashboard data={data} />
}
