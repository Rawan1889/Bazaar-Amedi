'use server'

import { revalidatePath } from 'next/cache'
import { createBazaarServer } from './supabase-server'

export async function updateProfile(formData: FormData) {
  const supabase = await createBazaarServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const fullName = (formData.get('fullName') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim()
  const neighborhood = (formData.get('neighborhood') as string)?.trim()

  if (!fullName || !phone) {
    return { error: 'Name and phone are required.' }
  }

  const { error } = await supabase
    .from('bazaar_profiles')
    .update({
      full_name: fullName,
      phone,
      neighborhood: neighborhood || null,
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/profile')
  return { success: true }
}

export async function getProfile() {
  const supabase = await createBazaarServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('bazaar_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile ? { ...profile, email: user.email } : null
}
