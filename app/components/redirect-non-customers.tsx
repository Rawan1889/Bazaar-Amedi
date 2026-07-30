'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBazaarClient } from '@/lib/bazaar/supabase-client'

// Client-side twin of lib/bazaar/require-customer. Drop into a customer-facing
// client page and it pushes shop owners / drivers / admins to their dashboard.
export function RedirectNonCustomers() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createBazaarClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return
      const { data: p } = await supabase
        .from('bazaar_profiles')
        .select('role')
        .eq('id', data.session.user.id)
        .single()
      if (!p) return
      if (p.role === 'market_admin') router.replace('/shop')
      else if (p.role === 'driver') router.replace('/driver')
      else if (p.role === 'super_admin') router.replace('/admin')
    })
  }, [router])

  return null
}
