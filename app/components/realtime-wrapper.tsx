'use client'

import { useEffect, useState } from 'react'
import { createBazaarClient } from '@/lib/bazaar/supabase-client'
import { OrderNotifications } from './order-notifications'
import { ShopOrdersRefresher } from './shop-orders-refresher'

type UserState = { id: string; role: string; shopId?: string }

export function RealtimeWrapper() {
  const [user, setUser] = useState<UserState | null>(null)

  useEffect(() => {
    const supabase = createBazaarClient()

    async function getUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const { data: profile } = await supabase
        .from('bazaar_profiles')
        .select('id, role')
        .eq('id', authUser.id)
        .single()

      if (!profile) return

      const state: UserState = { id: profile.id, role: profile.role }

      if (profile.role === 'market_admin') {
        const { data: shop } = await supabase
          .from('bazaar_shops')
          .select('id')
          .eq('owner_id', profile.id)
          .single()
        if (shop) state.shopId = shop.id
      }

      setUser(state)
    }

    getUser()
  }, [])

  if (!user) return null

  return (
    <>
      <OrderNotifications userId={user.id} role={user.role} />
      {user.role === 'market_admin' && user.shopId && (
        <ShopOrdersRefresher shopId={user.shopId} />
      )}
    </>
  )
}
