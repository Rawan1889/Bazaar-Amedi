'use server'

import { revalidatePath } from 'next/cache'
import { createBazaarServer } from './supabase-server'
import { getBazaarUser } from './auth'

export async function submitReview(formData: FormData) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Please sign in to leave a review.' }

  const shopId = formData.get('shopId') as string
  const rating = parseInt(formData.get('rating') as string)
  const comment = (formData.get('comment') as string)?.trim()

  if (!shopId || !rating || rating < 1 || rating > 5) {
    return { error: 'Please select a rating between 1 and 5.' }
  }

  const supabase = await createBazaarServer()

  const { data: existing } = await supabase
    .from('bazaar_reviews')
    .select('id')
    .eq('customer_id', user.id)
    .eq('shop_id', shopId)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('bazaar_reviews')
      .update({ rating, comment: comment || null })
      .eq('id', existing.id)

    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('bazaar_reviews')
      .insert({
        customer_id: user.id,
        shop_id: shopId,
        rating,
        comment: comment || null,
      })

    if (error) return { error: error.message }
  }

  revalidatePath(`/s/`, 'layout')
  return { success: true }
}

export async function getShopReviews(shopId: string) {
  const supabase = await createBazaarServer()

  const { data } = await supabase
    .from('bazaar_reviews')
    .select('*, bazaar_profiles!bazaar_reviews_customer_id_fkey(full_name)')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })
    .limit(20)

  return data || []
}

export async function getShopRating(shopId: string) {
  const supabase = await createBazaarServer()

  const { data } = await supabase
    .from('bazaar_reviews')
    .select('rating')
    .eq('shop_id', shopId)

  if (!data || data.length === 0) return { average: 0, count: 0 }

  const sum = data.reduce((acc, r) => acc + r.rating, 0)
  return { average: Math.round((sum / data.length) * 10) / 10, count: data.length }
}
