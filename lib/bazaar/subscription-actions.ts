'use server'

import { revalidatePath } from 'next/cache'
import { createBazaarAdmin } from './supabase-server'
import { getBazaarUser } from './auth'
import { sendPushToUser } from './push-notifications'
import { monthlyFee, nextPeriod } from './subscription'

async function requireAdmin() {
  const user = await getBazaarUser()
  if (!user || user.role !== 'super_admin') return null
  return user
}

function revalidateShopVisibility() {
  for (const path of ['/admin', '/admin/shops', '/shop', '/shops', '/browse']) revalidatePath(path)
}

const dateLabel = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Baghdad' })

// The shop paid cash at the office. The price comes from the shop's product
// count right now, never from the browser. Paying also unpauses the shop.
export async function recordSubscriptionPayment(shopId: string, months = 1) {
  const user = await requireAdmin()
  if (!user) return { error: 'Unauthorized' }
  if (!Number.isInteger(months) || months < 1 || months > 12) return { error: 'Choose between 1 and 12 months.' }

  const admin = createBazaarAdmin()
  const { data: shop } = await admin
    .from('bazaar_shops')
    .select('id, name, owner_id, trial_ends_at, paid_until, is_paused')
    .eq('id', shopId)
    .single()
  if (!shop) return { error: 'Shop not found.' }

  const { count } = await admin
    .from('bazaar_products')
    .select('id', { count: 'exact', head: true })
    .eq('shop_id', shopId)
  const productCount = count ?? 0
  const amount = monthlyFee(productCount) * months
  const { start, end } = nextPeriod(shop, Date.now(), months)

  const { error: payError } = await admin.from('bazaar_subscription_payments').insert({
    shop_id: shopId,
    amount,
    months,
    period_start: start.toISOString(),
    period_end: end.toISOString(),
    product_count: productCount,
    recorded_by: user.id,
  })
  if (payError) return { error: payError.message }

  const { error } = await admin
    .from('bazaar_shops')
    .update({ paid_until: end.toISOString(), is_paused: false, paused_at: null })
    .eq('id', shopId)
  if (error) return { error: error.message }

  sendPushToUser(shop.owner_id, {
    type: 'subscription_paid',
    title: 'Subscription received',
    body: `Thank you. ${shop.name} is paid until ${dateLabel(end)}.`,
    url: '/shop',
  })

  revalidateShopVisibility()
  return { success: true, amount, paidUntil: end.toISOString() }
}

// A paused shop is hidden from customers and can't take new orders.
export async function setShopPaused(shopId: string, paused: boolean) {
  const user = await requireAdmin()
  if (!user) return { error: 'Unauthorized' }

  const admin = createBazaarAdmin()
  const { data: shop, error } = await admin
    .from('bazaar_shops')
    .update({ is_paused: paused, paused_at: paused ? new Date().toISOString() : null })
    .eq('id', shopId)
    .select('owner_id, name')
    .single()
  if (error || !shop) return { error: error?.message || 'Shop not found.' }

  sendPushToUser(shop.owner_id, paused
    ? {
        type: 'shop_paused',
        title: 'Your shop is paused',
        body: `${shop.name} is hidden from customers until the monthly subscription is paid. Contact Kela to renew.`,
        url: '/shop',
      }
    : {
        type: 'shop_unpaused',
        title: 'Your shop is live again',
        body: `${shop.name} is visible to customers again.`,
        url: '/shop',
      })

  revalidateShopVisibility()
  return { success: true }
}
