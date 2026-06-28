'use client'

import { useCart } from '@/lib/bazaar/cart-context'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  white:    '#FFFFFF',
} as const

interface Props {
  productId: string
  variantId?: string
  shopId: string
  shopName: string
  shopSlug: string
  name: string
  price: number
  salePrice: number | null
  unit: string
  imageUrl: string | null
  stockQty?: number | null
}

export function AddToCartButton(props: Props) {
  const { items, addItem, updateQuantity } = useCart()
  const existing = items.find(i => i.productId === props.productId && i.variantId === props.variantId)

  if (existing) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); updateQuantity(props.productId, existing.quantity - 1, props.variantId) }}
          className="w-6 h-6 rounded-[4px] flex items-center justify-center border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[12px]"
          style={{ background: c.greenBg, color: c.green }}
        >
          -
        </button>
        <span className="w-5 text-center font-[family-name:var(--font-dm-sans)] text-[11px] font-medium" style={{ color: c.green }}>
          {existing.quantity}
        </span>
        <button
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            if (props.stockQty !== undefined && props.stockQty !== null && existing.quantity >= props.stockQty) {
              alert(`Sorry, only ${props.stockQty} unit(s) are available in stock.`)
              return
            }
            updateQuantity(props.productId, existing.quantity + 1, props.variantId)
          }}
          className="w-6 h-6 rounded-[4px] flex items-center justify-center border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[12px]"
          style={{ background: c.green, color: c.white }}
        >
          +
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={e => { e.preventDefault(); e.stopPropagation(); addItem(props) }}
      className="px-2.5 py-1 rounded-[6px] font-[family-name:var(--font-dm-sans)] text-[10px] font-medium border-none cursor-pointer transition-all duration-150"
      style={{ background: c.green, color: c.white }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(0.96)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      + Add
    </button>
  )
}
