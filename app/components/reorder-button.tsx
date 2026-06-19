'use client'

import { useCart } from '@/lib/bazaar/cart-context'
import { useRouter } from 'next/navigation'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
} as const

interface OrderItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  shop_id: string
  bazaar_shops: { name: string; slug: string } | null
}

interface Props {
  items: OrderItem[]
}

export function ReorderButton({ items }: Props) {
  const { addItem, updateQuantity, items: cartItems } = useCart()
  const router = useRouter()

  function handleReorder() {
    for (const item of items) {
      const existing = cartItems.find(c => c.productId === item.product_id)
      if (existing) {
        updateQuantity(item.product_id, item.quantity)
      } else {
        for (let i = 0; i < item.quantity; i++) {
          if (i === 0) {
            addItem({
              productId: item.product_id,
              shopId: item.shop_id,
              shopName: item.bazaar_shops?.name || 'Shop',
              shopSlug: item.bazaar_shops?.slug || '',
              name: item.product_name,
              price: item.unit_price,
              salePrice: null,
              unit: 'unit',
              imageUrl: null,
            })
          } else {
            updateQuantity(item.product_id, i + 1)
          }
        }
      }
    }
    router.push('/cart')
  }

  return (
    <button
      onClick={e => { e.preventDefault(); e.stopPropagation(); handleReorder() }}
      className="px-3 py-1.5 rounded-[8px] font-[family-name:var(--font-dm-sans)] text-[11px] font-medium border-none cursor-pointer transition-all duration-150 flex items-center gap-1.5"
      style={{ background: c.greenBg, color: c.green }}
      onMouseEnter={e => (e.currentTarget.style.background = c.green, e.currentTarget.style.color = '#fff')}
      onMouseLeave={e => (e.currentTarget.style.background = c.greenBg, e.currentTarget.style.color = c.green)}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 4v6h6M23 20v-6h-6" />
        <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
      </svg>
      Reorder
    </button>
  )
}
