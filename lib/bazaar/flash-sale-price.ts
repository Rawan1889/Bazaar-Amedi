// Which flash sale covers one product option, and at what price. Shared by
// checkout (server) and the product cards/pages, so the price a customer sees
// is the price they are charged.

export type FlashSaleLike = {
  sale_price: number
  ends_at: string
  is_active: boolean | null
  variant_id?: string | null
  quantity?: number | null
}

// A sale pinned to one option only covers that option; an "All options" sale
// (no variant_id) covers every option. Expired and sold-out sales are skipped.
export function saleForOption<S extends FlashSaleLike>(
  sales: S[] | null | undefined,
  variantId: string | null,
  now: number,
): S | null {
  return (sales ?? []).find(s =>
    !!s.is_active &&
    new Date(s.ends_at).getTime() > now &&
    (s.quantity == null || s.quantity > 0) &&
    (!s.variant_id || s.variant_id === variantId)
  ) ?? null
}

// An "All options" sale is set against the product's own price, so it takes
// the same percentage off every option — a 5 kg bag never drops to the 1 kg
// sale price.
export function flashSalePrice(sale: FlashSaleLike, productPrice: number, optionPrice: number): number {
  if (sale.variant_id || productPrice <= 0 || optionPrice === productPrice) {
    return Math.min(sale.sale_price, optionPrice)
  }
  return Math.min(optionPrice, Math.round(optionPrice * sale.sale_price / productPrice))
}

// The option a product card adds when the customer doesn't pick one.
export function defaultVariant<V extends { price: number }>(productPrice: number, variants: V[] | null | undefined): V | null {
  return variants?.find(v => v.price === productPrice) ?? variants?.[0] ?? null
}
