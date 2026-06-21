'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createBazaarServer, createBazaarAdmin } from './supabase-server'

function dashboardFor(role: string): string {
  if (role === 'market_admin' || role === 'market') return '/shop'
  if (role === 'driver') return '/driver'
  if (role === 'super_admin') return '/admin'
  return '/browse'
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

export async function bazaarSignup(formData: FormData) {
  const supabase = await createBazaarServer()
  const admin = createBazaarAdmin()

  const role = formData.get('role') as string
  const fullName = (formData.get('fullName') as string).trim()
  const phone = (formData.get('phone') as string).trim()
  const password = formData.get('password') as string
  const email = (formData.get('email') as string)?.trim()

  if (!fullName || !phone || !password || !email) {
    return { error: 'All fields are required, including email.' }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  // Phone-only signup is not yet supported — Supabase rejects synthetic emails,
  // and proper phone login needs an SMS provider (planned separately). Until then
  // a real email is required. The phone is still stored on the profile.
  const authEmail = email

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: authEmail,
    password,
    options: {
      data: { full_name: fullName, role, phone },
    },
  })

  if (authError) {
    return { error: authError.message }
  }

  const userId = authData.user?.id
  if (!userId) {
    return { error: 'Could not create account.' }
  }

  const bazaarRole = role === 'market' ? 'market_admin' : role === 'driver' ? 'driver' : 'customer'
  const neighborhood = formData.get('neighborhood') as string | null

  const { error: profileError } = await admin
    .from('bazaar_profiles')
    .insert({
      id: userId,
      role: bazaarRole,
      full_name: fullName,
      phone: `+964${phone.replace(/\s+/g, '')}`,
      neighborhood: neighborhood || null,
    })

  if (profileError) {
    console.error('Bazaar profile creation error:', profileError)
  }

  if (bazaarRole === 'market_admin') {
    const shopName = (formData.get('shopName') as string)?.trim()
    const category = formData.get('category') as string
    const location = (formData.get('location') as string)?.trim()

    if (shopName) {
      const slug = slugify(shopName) || `shop-${userId.slice(0, 8)}`

      const { data: categories } = await admin
        .from('bazaar_categories')
        .select('id')
        .eq('slug', category || '')
        .single()

      await admin.from('bazaar_shops').insert({
        owner_id: userId,
        name: shopName,
        slug,
        category_id: categories?.id || null,
        address: location || null,
        phone: `+964${phone.replace(/\s+/g, '')}`,
        is_approved: false,
      })
    }
  }

  // If Supabase didn't attach a session immediately (can happen even with confirmation off),
  // sign in explicitly so the user lands logged-in rather than seeing the waitlist screen.
  if (!authData.session) {
    await supabase.auth.signInWithPassword({ email: authEmail, password })
  }

  revalidatePath('/', 'layout')
  redirect(dashboardFor(bazaarRole))
}

export async function bazaarLogin(formData: FormData) {
  const supabase = await createBazaarServer()

  const identifier = (formData.get('identifier') as string).trim()
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signInWithPassword({ email: identifier, password })

  if (error) {
    return { error: 'Invalid email or password.' }
  }

  const { data: profile } = await supabase
    .from('bazaar_profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  revalidatePath('/', 'layout')
  redirect(dashboardFor(profile?.role ?? 'customer'))
}

export async function bazaarLogout() {
  const supabase = await createBazaarServer()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function getBazaarUser() {
  const supabase = await createBazaarServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('bazaar_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}
