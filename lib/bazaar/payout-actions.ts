'use server'

import { revalidatePath } from 'next/cache'
import { createBazaarServer, createBazaarAdmin } from './supabase-server'
import { getBazaarUser } from './auth'

export interface ShopEarnings {
  gross: number
  commissionRate: number
  commission: number
  net: number
  paidOut: number
  pending: number
  available: number
}

export interface Payout {
  id: string
  amount: number
  status: string
  note: string | null
  requested_at: string
  paid_at: string | null
}

async function shopForOwner() {
  const user = await getBazaarUser()
  if (!user || user.role !== 'market_admin') return null
  const supabase = await createBazaarServer()
  const { data: shop } = await supabase
    .from('bazaar_shops')
    .select('id, commission_rate')
    .eq('owner_id', user.id)
    .maybeSingle()
  return shop as { id: string; commission_rate: number } | null
}

// Gross = delivered order-item revenue for the shop. Net = gross − commission.
export async function getShopEarnings(): Promise<ShopEarnings | null> {
  const shop = await shopForOwner()
  if (!shop) return null
  const supabase = await createBazaarServer()

  const { data: items } = await supabase
    .from('bazaar_order_items')
    .select('quantity, unit_price, bazaar_orders!inner(status)')
    .eq('shop_id', shop.id)
    .eq('bazaar_orders.status', 'delivered')

  const gross = ((items as unknown as { quantity: number; unit_price: number }[]) || [])
    .reduce((s, i) => s + i.unit_price * i.quantity, 0)

  const rate = shop.commission_rate ?? 10
  const commission = Math.round(gross * rate / 100)
  const net = gross - commission

  const { data: payouts } = await supabase
    .from('bazaar_payouts')
    .select('amount, status')
    .eq('shop_id', shop.id)

  const rows = (payouts as { amount: number; status: string }[]) || []
  const paidOut = rows.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const pending = rows.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0)
  const available = Math.max(0, net - paidOut - pending)

  return { gross, commissionRate: rate, commission, net, paidOut, pending, available }
}

export async function getMyPayouts(): Promise<Payout[]> {
  const shop = await shopForOwner()
  if (!shop) return []
  const supabase = await createBazaarServer()
  const { data } = await supabase
    .from('bazaar_payouts')
    .select('id, amount, status, note, requested_at, paid_at')
    .eq('shop_id', shop.id)
    .order('requested_at', { ascending: false })
  return (data as Payout[]) || []
}

export async function requestPayout(amount: number) {
  const shop = await shopForOwner()
  if (!shop) return { error: 'Unauthorized' }
  if (!amount || amount <= 0) return { error: 'Enter an amount to withdraw.' }

  const earnings = await getShopEarnings()
  if (!earnings) return { error: 'Could not load earnings.' }
  if (amount > earnings.available) {
    return { error: `You can withdraw up to ${earnings.available.toLocaleString('en-IQ')} IQD.` }
  }

  const supabase = await createBazaarServer()
  const { error } = await supabase
    .from('bazaar_payouts')
    .insert({ shop_id: shop.id, amount, status: 'pending' })

  if (error) return { error: error.message }
  revalidatePath('/shop/earnings')
  return { success: true }
}

// --- Admin -----------------------------------------------------------

export interface AdminPayout extends Payout {
  shop_id: string
  shop_name: string
}

export async function getPendingPayouts(): Promise<AdminPayout[]> {
  const user = await getBazaarUser()
  if (!user || user.role !== 'super_admin') return []
  const admin = createBazaarAdmin()
  const { data } = await admin
    .from('bazaar_payouts')
    .select('id, amount, status, note, requested_at, paid_at, shop_id, bazaar_shops(name)')
    .eq('status', 'pending')
    .order('requested_at', { ascending: true })

  return ((data as unknown as (Payout & { shop_id: string; bazaar_shops: { name: string } | null })[]) || [])
    .map(p => ({ ...p, shop_name: p.bazaar_shops?.name || 'Shop' }))
}

export async function markPayoutPaid(payoutId: string) {
  const user = await getBazaarUser()
  if (!user || user.role !== 'super_admin') return { error: 'Unauthorized' }
  const admin = createBazaarAdmin()
  const { error } = await admin
    .from('bazaar_payouts')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', payoutId)
  if (error) return { error: error.message }
  revalidatePath('/admin/payouts')
  return { success: true }
}

export async function updateCommissionRate(shopId: string, rate: number) {
  const user = await getBazaarUser()
  if (!user || user.role !== 'super_admin') return { error: 'Unauthorized' }
  if (isNaN(rate) || rate < 0 || rate > 100) return { error: 'Rate must be 0–100.' }
  const admin = createBazaarAdmin()
  const { error } = await admin
    .from('bazaar_shops')
    .update({ commission_rate: rate })
    .eq('id', shopId)
  if (error) return { error: error.message }
  revalidatePath('/admin/shops')
  return { success: true }
}
