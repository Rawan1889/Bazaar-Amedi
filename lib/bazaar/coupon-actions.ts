'use server'

import { revalidatePath } from 'next/cache'
import { createBazaarServer } from './supabase-server'
import { getBazaarUser } from './auth'

export async function createCoupon(formData: FormData) {
  const user = await getBazaarUser()
  if (!user || user.role !== 'market_admin') return { error: 'Unauthorized' }

  const supabase = await createBazaarServer()

  const { data: shop } = await supabase
    .from('bazaar_shops')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!shop) return { error: 'No shop found' }

  const code = (formData.get('code') as string)?.trim().toUpperCase()
  const discountType = formData.get('discountType') as string
  const discountValue = parseInt(formData.get('discountValue') as string)
  const minOrder = parseInt(formData.get('minOrder') as string) || 0
  const maxUses = parseInt(formData.get('maxUses') as string) || null
  const expiresAt = formData.get('expiresAt') as string

  if (!code || code.length < 3) return { error: 'Code must be at least 3 characters.' }
  if (!discountValue || discountValue <= 0) return { error: 'Discount value must be positive.' }
  if (discountType === 'percentage' && discountValue > 50) return { error: 'Max percentage discount is 50%.' }

  const { error } = await supabase
    .from('bazaar_coupons')
    .insert({
      shop_id: shop.id,
      code,
      discount_type: discountType,
      discount_value: discountValue,
      min_order: minOrder,
      max_uses: maxUses,
      expires_at: expiresAt || null,
      is_active: true,
    })

  if (error) {
    if (error.code === '23505') return { error: 'This coupon code already exists.' }
    return { error: error.message }
  }

  revalidatePath('/shop/coupons')
  return { success: true }
}

export async function getShopCoupons() {
  const user = await getBazaarUser()
  if (!user) return []

  const supabase = await createBazaarServer()

  const { data: shop } = await supabase
    .from('bazaar_shops')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!shop) return []

  const { data } = await supabase
    .from('bazaar_coupons')
    .select('*')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false })

  return data || []
}

export async function toggleCoupon(couponId: string, isActive: boolean) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createBazaarServer()

  const { error } = await supabase
    .from('bazaar_coupons')
    .update({ is_active: isActive })
    .eq('id', couponId)

  if (error) return { error: error.message }

  revalidatePath('/shop/coupons')
  return { success: true }
}

export async function deleteCoupon(couponId: string) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createBazaarServer()

  const { error } = await supabase
    .from('bazaar_coupons')
    .delete()
    .eq('id', couponId)

  if (error) return { error: error.message }

  revalidatePath('/shop/coupons')
  return { success: true }
}

export async function applyCoupon(code: string, shopIds: string[], subtotal: number) {
  if (!code.trim()) return { error: 'Please enter a coupon code.' }

  const supabase = await createBazaarServer()

  const { data: coupon } = await supabase
    .from('bazaar_coupons')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .eq('is_active', true)
    .in('shop_id', shopIds)
    .single()

  if (!coupon) return { error: 'Invalid or expired coupon code.' }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { error: 'This coupon has expired.' }
  }

  if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
    return { error: 'This coupon has reached its usage limit.' }
  }

  if (coupon.min_order > 0 && subtotal < coupon.min_order) {
    return { error: `Minimum order of ${coupon.min_order} IQD required for this coupon.` }
  }

  let discount = 0
  if (coupon.discount_type === 'percentage') {
    discount = Math.round(subtotal * (coupon.discount_value / 100))
  } else {
    discount = Math.min(coupon.discount_value, subtotal)
  }

  return {
    success: true,
    discount,
    couponId: coupon.id,
    description: coupon.discount_type === 'percentage'
      ? `${coupon.discount_value}% off`
      : `${coupon.discount_value} IQD off`,
  }
}
