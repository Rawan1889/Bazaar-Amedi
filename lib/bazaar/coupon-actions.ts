'use server'

import { revalidatePath } from 'next/cache'
import { createBazaarServer, createBazaarAdmin } from './supabase-server'
import { getBazaarUser } from './auth'
import { couponDiscount, type CouponRow } from './order-pricing'

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

  if (error?.code === '23503') {
    // Already used on an order: keep it for the shop's earnings history and
    // just switch it off.
    const { error: offError } = await supabase.from('bazaar_coupons').update({ is_active: false }).eq('id', couponId)
    if (offError) return { error: offError.message }
    revalidatePath('/shop/coupons')
    return { success: true }
  }
  if (error) return { error: error.message }

  revalidatePath('/shop/coupons')
  return { success: true }
}

// Checks a code against the shops in the cart. `shopSubtotals` maps each
// shop id to that shop's part of the cart: a coupon only discounts the items
// of the shop that issued it.
export async function applyCoupon(code: string, shopSubtotals: Record<string, number>) {
  const clean = code.trim().toUpperCase()
  if (!clean) return { error: 'Please enter a coupon code.' }
  const user = await getBazaarUser()
  if (!user) return { error: 'Please sign in to use a coupon.' }
  const shopIds = Object.keys(shopSubtotals)
  if (!shopIds.length) return { error: 'Your cart is empty.' }

  // Service role: customers can't read the coupons table (phase 33), so codes
  // can't be listed — only checked one at a time, here.
  const { data: coupons } = await createBazaarAdmin()
    .from('bazaar_coupons')
    .select('id, shop_id, discount_type, discount_value, min_order, max_uses, uses_count, is_active, expires_at, bazaar_shops(name)')
    .eq('code', clean)
    .in('shop_id', shopIds)
  if (!coupons?.length) return { error: 'Invalid or expired coupon code.' }

  // Codes are unique per shop, so two shops in one cart can share a code.
  // Use whichever gives the bigger discount.
  let best: { coupon: (typeof coupons)[number]; discount: number } | null = null
  let lastError = 'Invalid or expired coupon code.'
  for (const coupon of coupons) {
    const result = couponDiscount(coupon as CouponRow, shopSubtotals[coupon.shop_id] ?? 0, Date.now())
    if ('error' in result) { lastError = result.error; continue }
    if (!best || result.discount > best.discount) best = { coupon, discount: result.discount }
  }
  if (!best) return { error: lastError }

  const { coupon, discount } = best
  const shopName = (coupon.bazaar_shops as unknown as { name: string } | null)?.name
  const off = coupon.discount_type === 'percentage'
    ? `${coupon.discount_value}% off`
    : `${coupon.discount_value.toLocaleString('en-IQ')} IQD off`
  return {
    success: true,
    discount,
    couponId: coupon.id,
    description: shopName ? `${off} ${shopName}` : off,
  }
}
