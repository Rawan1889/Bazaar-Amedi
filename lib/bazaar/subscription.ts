// Shop subscription rules. Kept free of 'use server' and Next.js imports so
// it can be unit-tested and shared by server pages and client components.
//
// Every shop gets one free month from signup (trial_ends_at, set by the
// database). After that it pays monthly in cash; the admin records each
// payment, which moves paid_until forward.

// Monthly price in IQD by how many products the shop lists.
export const SUBSCRIPTION_TIERS = [
  { upTo: 100, price: 15_000 },
  { upTo: 300, price: 25_000 },
  { upTo: 500, price: 35_000 },
] as const

const DAY_MS = 24 * 60 * 60 * 1000

// Above the last tier, the last tier's price applies until a bigger one is set.
export function monthlyFee(productCount: number): number {
  const tier = SUBSCRIPTION_TIERS.find(t => productCount <= t.upTo)
  return (tier ?? SUBSCRIPTION_TIERS[SUBSCRIPTION_TIERS.length - 1]).price
}

export function tierLabel(productCount: number): string {
  let from = 0
  for (const t of SUBSCRIPTION_TIERS) {
    if (productCount <= t.upTo) return from === 0 ? `Up to ${t.upTo} products` : `${from + 1}–${t.upTo} products`
    from = t.upTo
  }
  return `${from}+ products`
}

// Same day next month; clamps to the month's last day (31 Jan -> 28/29 Feb).
export function addMonths(from: Date, months: number): Date {
  const day = from.getUTCDate()
  const d = new Date(from.getTime())
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() + months)
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
  d.setUTCDate(Math.min(day, lastDay))
  return d
}

export type SubscriptionShop = {
  trial_ends_at: string | null
  paid_until: string | null
}

export type SubscriptionStatus =
  | { state: 'trial'; until: string; daysLeft: number; paidUntil: string | null }
  | { state: 'paid'; until: string; daysLeft: number; paidUntil: string | null }
  | { state: 'overdue'; since: string; daysOverdue: number; paidUntil: string | null }

const time = (iso: string | null) => (iso ? Date.parse(iso) : 0)

export function subscriptionStatus(shop: SubscriptionShop, now: number): SubscriptionStatus {
  const trialEnd = time(shop.trial_ends_at)
  const paidEnd = time(shop.paid_until)
  const paidUntil = shop.paid_until
  if (trialEnd > now) {
    return { state: 'trial', until: new Date(trialEnd).toISOString(), daysLeft: Math.ceil((trialEnd - now) / DAY_MS), paidUntil }
  }
  if (paidEnd > now) {
    return { state: 'paid', until: new Date(paidEnd).toISOString(), daysLeft: Math.ceil((paidEnd - now) / DAY_MS), paidUntil }
  }
  const since = Math.max(trialEnd, paidEnd)
  return { state: 'overdue', since: new Date(since).toISOString(), daysOverdue: Math.floor((now - since) / DAY_MS), paidUntil }
}

// The period a new payment covers: it continues from whatever is already
// covered (free month or earlier payment), or starts today if that has lapsed.
export function nextPeriod(shop: SubscriptionShop, now: number, months: number): { start: Date; end: Date } {
  const start = new Date(Math.max(now, time(shop.trial_ends_at), time(shop.paid_until)))
  return { start, end: addMonths(start, months) }
}
