import { describe, expect, it } from 'vitest'
import { monthRange, splitDeliveryFees, summarizeDeliveryCut, type DeliveredOrder } from '@/lib/bazaar/delivery-cut'

function order(over: Partial<DeliveredOrder> = {}): DeliveredOrder {
  return {
    delivery_fee: 2500,
    driver_id: 'shvan',
    driver_name: 'Shvan Hajji',
    driver_phone: '+9647504118263',
    fleet_id: null,
    fleet_name: null,
    ...over,
  }
}

describe('splitDeliveryFees', () => {
  it('takes 15% of the delivery fee for Kela', () => {
    expect(splitDeliveryFees(2500)).toEqual({ kela: 375, share: 2125 })
    expect(splitDeliveryFees(0)).toEqual({ kela: 0, share: 0 })
  })
})

describe('summarizeDeliveryCut', () => {
  it('groups independent drivers and counts only delivery fees', () => {
    const r = summarizeDeliveryCut([
      order(),
      order({ delivery_fee: 3000 }),
      order({ driver_id: 'dilshad', driver_name: 'Dilshad Omer', delivery_fee: 2000 }),
    ])
    expect(r.fleets).toEqual([])
    expect(r.drivers.map(d => [d.id, d.deliveries, d.fees, d.kela, d.share])).toEqual([
      ['shvan', 2, 5500, 825, 4675],
      ['dilshad', 1, 2000, 300, 1700],
    ])
    expect(r.totals).toEqual({ deliveries: 3, fees: 7500, kela: 1125, share: 6375 })
  })

  it('puts company drivers under their company, with a per-driver breakdown', () => {
    const r = summarizeDeliveryCut([
      order({ fleet_id: 'zagros', fleet_name: 'Zagros Express', driver_id: 'rebin', driver_name: 'Rebin Sleman' }),
      order({ fleet_id: 'zagros', fleet_name: 'Zagros Express', driver_id: 'rebin', driver_name: 'Rebin Sleman', delivery_fee: 3500 }),
      order({ fleet_id: 'zagros', fleet_name: 'Zagros Express', driver_id: 'hozan', driver_name: 'Hozan Ali' }),
      order(),
    ])
    expect(r.fleets).toHaveLength(1)
    expect(r.fleets[0]).toMatchObject({ id: 'zagros', name: 'Zagros Express', deliveries: 3, fees: 8500, kela: 1275, share: 7225 })
    expect(r.fleets[0].drivers.map(d => [d.id, d.deliveries, d.fees])).toEqual([['rebin', 2, 6000], ['hozan', 1, 2500]])
    expect(r.drivers.map(d => d.id)).toEqual(['shvan'])
    expect(r.totals.fees).toBe(11000)
  })

  it('treats a missing or negative fee as zero', () => {
    const r = summarizeDeliveryCut([order({ delivery_fee: null }), order({ delivery_fee: -500 })])
    expect(r.totals).toEqual({ deliveries: 2, fees: 0, kela: 0, share: 0 })
  })
})

describe('monthRange', () => {
  it('uses calendar months in Iraq time', () => {
    // 22:30 UTC on 31 Oct is already 1 Nov in Amedi.
    const now = Date.parse('2026-10-31T22:30:00Z')
    expect(monthRange(now, 0)).toEqual({ from: '2026-10-31T21:00:00.000Z', to: '2026-11-30T21:00:00.000Z' })
    expect(monthRange(now, 1)).toEqual({ from: '2026-09-30T21:00:00.000Z', to: '2026-10-31T21:00:00.000Z' })
  })

  it('rolls back across a year', () => {
    expect(monthRange(Date.parse('2027-01-10T09:00:00Z'), 1)).toEqual({ from: '2026-11-30T21:00:00.000Z', to: '2026-12-31T21:00:00.000Z' })
  })
})
