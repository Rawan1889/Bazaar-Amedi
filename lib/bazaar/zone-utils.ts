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

// Per-extra-shop surcharge on multi-shop orders (in IQD).
// The first shop is included in the base zone fee; each additional shop adds this.
export const EXTRA_SHOP_SURCHARGE = 500

// Compute the delivery fee for a multi-shop order.
// Base = the highest zone fee among the customer's zone and each shop's zone
// (whichever is farthest / most expensive to reach). Free-delivery threshold on
// the customer's zone still waives everything. Then add EXTRA_SHOP_SURCHARGE per
// shop beyond the first.
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
  const zoneFees = [customerZone?.fee ?? 0, ...shopZones.map(z => z.fee)]
  const base = Math.max(...zoneFees, 0)
  const extra = Math.max(0, shopCount - 1) * EXTRA_SHOP_SURCHARGE
  return base + extra
}
