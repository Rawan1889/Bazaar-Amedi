'use client'

import { useEffect, useState } from 'react'
import { createBazaarClient } from '@/lib/bazaar/supabase-client'
import { OrderNotifications } from './order-notifications'

export function RealtimeWrapper() {
  const [user, setUser] = useState<{ id: string; role: string } | null>(null)

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

      if (profile) {
        setUser({ id: profile.id, role: profile.role })
      }
    }

    getUser()
  }, [])

  if (!user) return null

  return <OrderNotifications userId={user.id} role={user.role} />
}
