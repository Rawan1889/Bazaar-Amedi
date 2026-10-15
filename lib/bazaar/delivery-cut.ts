// Kela's cut of delivery fees, per driver and per delivery company. Kept free
// of 'use server' and Next.js imports so it can be unit-tested.
//
// The cut is taken from the delivery fee only — never from the order total.

export const KELA_DELIVERY_CUT_PERCENT = 15

export function splitDeliveryFees(fees: number): { kela: number; share: number } {
  const kela = Math.round((fees * KELA_DELIVERY_CUT_PERCENT) / 100)
  return { kela, share: fees - kela }
}

export type DeliveredOrder = {
  delivery_fee: number | null
  driver_id: string
  driver_name: string
  driver_phone: string | null
  fleet_id: string | null
  fleet_name: string | null
}

export type CutLine = {
  id: string
  name: string
  phone: string | null
  deliveries: number
  fees: number
  kela: number
  share: number
}

export type FleetCut = CutLine & { drivers: CutLine[] }

export type DeliveryCutReport = {
  fleets: FleetCut[]
  drivers: CutLine[]
  totals: { deliveries: number; fees: number; kela: number; share: number }
}

function line(id: string, name: string, phone: string | null): CutLine {
  return { id, name, phone, deliveries: 0, fees: 0, kela: 0, share: 0 }
}

function finish<T extends CutLine>(l: T): T {
  return { ...l, ...splitDeliveryFees(l.fees) }
}

const byFees = (a: CutLine, b: CutLine) => b.fees - a.fees || a.name.localeCompare(b.name)

// Orders handled through a delivery company count toward that company (with
// a per-driver breakdown); everyone else is an independent driver.
export function summarizeDeliveryCut(orders: DeliveredOrder[]): DeliveryCutReport {
  const fleets = new Map<string, FleetCut & { byDriver: Map<string, CutLine> }>()
  const drivers = new Map<string, CutLine>()

  for (const o of orders) {
    const fee = Math.max(0, o.delivery_fee ?? 0)
    if (o.fleet_id) {
      let f = fleets.get(o.fleet_id)
      if (!f) {
        f = { ...line(o.fleet_id, o.fleet_name || 'Delivery company', null), drivers: [], byDriver: new Map() }
        fleets.set(o.fleet_id, f)
      }
      f.deliveries += 1
      f.fees += fee
      let d = f.byDriver.get(o.driver_id)
      if (!d) { d = line(o.driver_id, o.driver_name, o.driver_phone); f.byDriver.set(o.driver_id, d) }
      d.deliveries += 1
      d.fees += fee
    } else {
      let d = drivers.get(o.driver_id)
      if (!d) { d = line(o.driver_id, o.driver_name, o.driver_phone); drivers.set(o.driver_id, d) }
      d.deliveries += 1
      d.fees += fee
    }
  }

  const fleetList = [...fleets.values()]
    .map(({ byDriver, ...f }) => finish({ ...f, drivers: [...byDriver.values()].map(finish).sort(byFees) }))
    .sort(byFees)
  const driverList = [...drivers.values()].map(finish).sort(byFees)

  const deliveries = orders.length
  const fees = [...fleetList, ...driverList].reduce((s, l) => s + l.fees, 0)
  const kela = [...fleetList, ...driverList].reduce((s, l) => s + l.kela, 0)
  return { fleets: fleetList, drivers: driverList, totals: { deliveries, fees, kela, share: fees - kela } }
}

// Calendar months in Iraq time (UTC+3, no daylight saving).
const BAGHDAD_OFFSET_MS = 3 * 60 * 60 * 1000

export function monthRange(now: number, monthsBack: number): { from: string; to: string } {
  const local = new Date(now + BAGHDAD_OFFSET_MS)
  const y = local.getUTCFullYear()
  const m = local.getUTCMonth() - monthsBack
  return {
    from: new Date(Date.UTC(y, m, 1) - BAGHDAD_OFFSET_MS).toISOString(),
    to: new Date(Date.UTC(y, m + 1, 1) - BAGHDAD_OFFSET_MS).toISOString(),
  }
}
