'use client'

import { useEffect, useState } from 'react'
import { createBazaarClient } from '@/lib/bazaar/supabase-client'
import { NotificationBell } from './notification-bell'
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

  return (
    <>
      {/* Mobile-only floating bell — desktop navs render it inline next to the language switcher. */}
      <div className="fixed top-4 right-4 rtl:right-auto rtl:left-4 z-40 md:hidden">
        <NotificationBell />
      </div>
      <PushPrompt userId={userId} />
    </>
  )
}
