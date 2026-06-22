'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRealtimeShopOrders } from '@/lib/bazaar/use-realtime-orders'

export function ShopOrdersRefresher({ shopId }: { shopId: string }) {
  const { newOrderCount } = useRealtimeShopOrders(shopId)
  const router = useRouter()

  useEffect(() => {
    if (newOrderCount > 0) router.refresh()
  }, [newOrderCount, router])

  return null
}
