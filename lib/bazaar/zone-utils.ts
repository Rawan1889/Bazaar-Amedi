// Plain (non-server) helpers for delivery zones, importable from both client
// components and server actions.

export interface DeliveryZone {
  id: string
  name: string
  fee: number
  min_order: number
  free_delivery_threshold: number | null
  is_active: boolean
  sort_order: number
}

// Compute the delivery fee for a zone given an order subtotal.
// A free-delivery threshold waives the fee; returns 0 when no zone is given.
export function feeForZone(
  zone: Pick<DeliveryZone, 'fee' | 'free_delivery_threshold'> | null | undefined,
  subtotal: number
): number {
  if (!zone) return 0
  if (zone.free_delivery_threshold != null && subtotal >= zone.free_delivery_threshold) return 0
  return zone.fee
}

// Orders from 3 or more shops need two pickup runs, so they pay two
// delivery fees; 1–2 shops pay one.
export const TWO_FEE_SHOP_COUNT = 3

// Compute the delivery fee for a multi-shop order.
// 1–2 shops: the highest zone fee among the customer's zone and the shops'
// zones (the farthest area). 3+ shops: the two highest fees added together
// (the farthest fee twice if only one zone is involved). The free-delivery
// threshold on the customer's zone still waives everything.
export function computeDeliveryFee(args: {
  customerZone: Pick<DeliveryZone, 'fee' | 'free_delivery_threshold'> | null | undefined
  shopZones: Pick<DeliveryZone, 'fee'>[]
  subtotal: number
  shopCount: number
}): number {
  const { customerZone, shopZones, subtotal, shopCount } = args
  if (customerZone?.free_delivery_threshold != null && subtotal >= customerZone.free_delivery_threshold) {
    return 0
  }
  const fees = [customerZone?.fee ?? 0, ...shopZones.map(z => z.fee)].sort((a, b) => b - a)
  const farthest = Math.max(fees[0] ?? 0, 0)
  if (shopCount < TWO_FEE_SHOP_COUNT) return farthest
  const second = fees[1] && fees[1] > 0 ? fees[1] : farthest
  return farthest + second
}
