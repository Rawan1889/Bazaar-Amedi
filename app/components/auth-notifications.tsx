'use client'

import { useEffect, useState } from 'react'
import { createBazaarClient } from '@/lib/bazaar/supabase-client'
import { PushPrompt } from './push-prompt'

export function AuthNotifications() {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createBazaarClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])

  if (!userId) return null

  // Bell is rendered inline in each role's nav (mobile bottom nav for customer/
  // driver, sidebar header for shop/admin, desktop header everywhere) so this
  // component now only owns the push-permission prompt.
  return <PushPrompt userId={userId} />
}
