'use server'

import { revalidatePath } from 'next/cache'
import { createBazaarServer } from './supabase-server'
import { getBazaarUser } from './auth'

export async function updateOnboardingStep(step: number) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createBazaarServer()

  const { data: shop } = await supabase
    .from('bazaar_shops')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!shop) return { error: 'No shop found' }

  await supabase
    .from('bazaar_shops')
    .update({ onboarding_step: step })
    .eq('id', shop.id)

  revalidatePath('/shop')
  return { success: true }
}

export async function completeOnboarding() {
  const user = await getBazaarUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createBazaarServer()

  const { data: shop } = await supabase
    .from('bazaar_shops')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!shop) return { error: 'No shop found' }

  await supabase
    .from('bazaar_shops')
    .update({ onboarding_step: 4, onboarding_completed: true, is_open: true })
    .eq('id', shop.id)

  revalidatePath('/shop')
  return { success: true }
}
