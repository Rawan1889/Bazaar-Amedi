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
