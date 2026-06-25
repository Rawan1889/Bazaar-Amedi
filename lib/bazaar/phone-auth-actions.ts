'use server'

import { revalidatePath } from 'next/cache'
import { createBazaarServer, createBazaarAdmin } from './supabase-server'

// Called after a successful phone-OTP verification (which already set a session).
// Ensures the authenticated phone user has a bazaar_profiles row. New phone
// users become customers; if we don't yet have their name, we ask for it.
export async function ensureBazaarProfile(fullName?: string): Promise<
  | { redirect: string }
  | { needsName: true }
  | { error: string }
> {
  const supabase = await createBazaarServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated. Please verify your phone again.' }

  // Existing profile? Route them to their dashboard.
  const { data: profile } = await supabase
    .from('bazaar_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile) {
    revalidatePath('/', 'layout')
    return { redirect: dashboardFor(profile.role) }
  }

  // New phone user — need a name to create the profile.
  if (!fullName || !fullName.trim()) return { needsName: true }

  const phone = user.phone ? `+${user.phone.replace(/^\+/, '')}` : null

  const admin = createBazaarAdmin()
  const { error } = await admin.from('bazaar_profiles').insert({
    id: user.id,
    role: 'customer',
    full_name: fullName.trim(),
    phone: phone || 'unknown',
    is_approved: true,
  })

  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { redirect: '/browse' }
}

function dashboardFor(role: string): string {
  switch (role) {
    case 'market_admin': return '/shop'
    case 'driver': return '/driver'
    case 'super_admin': return '/admin'
    default: return '/browse'
  }
}
