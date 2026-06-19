'use client'

import { useTransition } from 'react'
import { confirmShopItems } from '@/lib/bazaar/order-actions'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  saffron:  '#E8A838',
  saffronBg:'rgba(232,168,56,0.08)',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
} as const

function formatIQD(amount: number) {
  return new Intl.NumberFormat('en-IQ').format(amount) + ' IQD'
}

interface OrderGroup {
  order: Record<string, unknown>
  items: Record<string, unknown>[]
}

function OrderCard({ group }: { group: OrderGroup }) {
  const [isPending, startTransition] = useTransition()
  const order = group.order as {
    id: string; order_number: number; status: string; delivery_address: string; created_at: string
    bazaar_profiles: { full_name: string; phone: string }
  }
  const items = group.items as { product_name: string; quantity: number; unit_price: number; pickup_status: string }[]

  const allPickedUp = items.every(i => i.pickup_status === 'picked_up')
  const total = items.reduce((s, i) => s + i.unit_price * i.quantity, 0)

  return (
    <div className="rounded-[14px] p-5" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="font-[family-name:var(--font-dm-sans)] text-[15px] font-medium" style={{ color: c.charcoal }}>
            Order #{order.order_number}
          </span>
          <span
            className="px-2 py-0.5 rounded-[4px] font-[family-name:var(--font-dm-mono)] text-[10px] font-medium"
            style={{
              background: allPickedUp ? c.greenBg : c.saffronBg,
              color: allPickedUp ? c.green : c.saffron,
            }}
          >
            {allPickedUp ? 'Ready' : 'Preparing'}
          </span>
        </div>
        <span className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ color: c.green }}>
          {formatIQD(total)}
        </span>
      </div>

      <div className="mb-3">
        <div className="font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ color: c.stone }}>
          {order.bazaar_profiles?.full_name} — {order.bazaar_profiles?.phone}
        </div>
        <div className="font-[family-name:var(--font-dm-mono)] text-[10px] mt-0.5" style={{ color: c.stone }}>
          {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <div className="flex flex-col gap-1 mb-3 pb-3" style={{ borderBottom: `1px solid ${c.cream}` }}>
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ color: c.charcoal }}>
            <span>{item.quantity}x {item.product_name}</span>
            <span style={{ color: c.stone }}>{formatIQD(item.unit_price * item.quantity)}</span>
          </div>
        ))}
      </div>

      {!allPickedUp && (
        <button
          onClick={() => startTransition(() => { confirmShopItems(order.id) })}
          disabled={isPending}
          className="w-full py-2.5 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[13px] font-medium border-none cursor-pointer"
          style={{ background: c.green, color: '#fff', opacity: isPending ? 0.7 : 1 }}
        >
          {isPending ? 'Confirming...' : 'Mark items ready for pickup'}
        </button>
      )}
    </div>
  )
}

export function ShopOrderList({ orders }: { orders: OrderGroup[] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-[14px] p-8 text-center" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
        <p className="font-[family-name:var(--font-dm-sans)] text-[14px]" style={{ color: c.stone }}>
          No orders yet. They will appear here when customers order from your shop.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {orders.map(group => (
        <OrderCard key={group.order.id as string} group={group} />
      ))}
    </div>
  )
}
