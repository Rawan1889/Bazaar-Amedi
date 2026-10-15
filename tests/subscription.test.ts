import { describe, expect, it } from 'vitest'
import { addMonths, monthlyFee, nextPeriod, subscriptionStatus, tierLabel } from '@/lib/bazaar/subscription'

const NOW = Date.parse('2026-10-15T09:00:00Z')
const DAY = 24 * 60 * 60 * 1000
const iso = (t: number) => new Date(t).toISOString()

describe('monthlyFee', () => {
  it('prices by product count: up to 100, 101-300, 301-500', () => {
    expect(monthlyFee(0)).toBe(15_000)
    expect(monthlyFee(100)).toBe(15_000)
    expect(monthlyFee(101)).toBe(25_000)
    expect(monthlyFee(300)).toBe(25_000)
    expect(monthlyFee(301)).toBe(35_000)
    expect(monthlyFee(500)).toBe(35_000)
  })

  it('keeps the top price above 500 products', () => {
    expect(monthlyFee(812)).toBe(35_000)
  })

  it('labels the tier', () => {
    expect(tierLabel(42)).toBe('Up to 100 products')
    expect(tierLabel(150)).toBe('101–300 products')
    expect(tierLabel(450)).toBe('301–500 products')
    expect(tierLabel(600)).toBe('500+ products')
  })
})

describe('addMonths', () => {
  it('moves to the same day next month', () => {
    expect(addMonths(new Date('2026-10-15T09:00:00Z'), 1).toISOString()).toBe('2026-11-15T09:00:00.000Z')
    expect(addMonths(new Date('2026-12-20T00:00:00Z'), 1).toISOString()).toBe('2027-01-20T00:00:00.000Z')
  })

  it('clamps to the end of a shorter month', () => {
    expect(addMonths(new Date('2027-01-31T10:00:00Z'), 1).toISOString()).toBe('2027-02-28T10:00:00.000Z')
    expect(addMonths(new Date('2028-01-31T10:00:00Z'), 1).toISOString()).toBe('2028-02-29T10:00:00.000Z')
  })
})

describe('subscriptionStatus', () => {
  it('is on the free month until the trial ends', () => {
    const s = subscriptionStatus({ trial_ends_at: iso(NOW + 12 * DAY - 1000), paid_until: null }, NOW)
    expect(s).toMatchObject({ state: 'trial', daysLeft: 12 })
  })

  it('is paid while paid_until is in the future', () => {
    const s = subscriptionStatus({ trial_ends_at: iso(NOW - 20 * DAY), paid_until: iso(NOW + 3 * DAY) }, NOW)
    expect(s).toMatchObject({ state: 'paid', daysLeft: 3 })
  })

  it('is overdue once the free month and payments have run out', () => {
    expect(subscriptionStatus({ trial_ends_at: iso(NOW - 5 * DAY), paid_until: null }, NOW))
      .toMatchObject({ state: 'overdue', daysOverdue: 5 })
    expect(subscriptionStatus({ trial_ends_at: iso(NOW - 40 * DAY), paid_until: iso(NOW - 2 * DAY) }, NOW))
      .toMatchObject({ state: 'overdue', daysOverdue: 2 })
  })

  it('shows the free month even when the shop paid ahead', () => {
    const s = subscriptionStatus({ trial_ends_at: iso(NOW + 4 * DAY), paid_until: iso(NOW + 34 * DAY) }, NOW)
    expect(s).toMatchObject({ state: 'trial', daysLeft: 4, paidUntil: iso(NOW + 34 * DAY) })
  })
})

describe('nextPeriod', () => {
  it('continues after the free month when paying early', () => {
    const trialEnd = Date.parse('2026-10-20T08:00:00Z')
    const { start, end } = nextPeriod({ trial_ends_at: iso(trialEnd), paid_until: null }, NOW, 1)
    expect(start.toISOString()).toBe('2026-10-20T08:00:00.000Z')
    expect(end.toISOString()).toBe('2026-11-20T08:00:00.000Z')
  })

  it('continues after the last paid month', () => {
    const { start } = nextPeriod({ trial_ends_at: iso(NOW - 40 * DAY), paid_until: '2026-10-30T00:00:00.000Z' }, NOW, 1)
    expect(start.toISOString()).toBe('2026-10-30T00:00:00.000Z')
  })

  it('starts today when the shop was overdue', () => {
    const { start, end } = nextPeriod({ trial_ends_at: iso(NOW - 9 * DAY), paid_until: null }, NOW, 2)
    expect(start.getTime()).toBe(NOW)
    expect(end.toISOString()).toBe('2026-12-15T09:00:00.000Z')
  })
})
