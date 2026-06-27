'use client'

import { useTransition } from 'react'
import { acceptShopOrder, markShopOrderReady, markPickupCollected } from '@/lib/bazaar/order-actions'
import { OrderChat } from '@/app/components/order-chat'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  saffron:  '#E8A838',
  saffronBg:'rgba(232,168,56,0.08)',
  terra:    '#C4654A',
  terraBg:  'rgba(196,101,74,0.08)',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
} as const

function formatIQD(amount: number) {
  return new Intl.NumberFormat('en-IQ').format(amount) + ' IQD'
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: 'New order',       color: c.saffron, bg: c.saffronBg },
  confirmed:  { label: 'Preparing',       color: c.green,   bg: c.greenBg   },
  ready:      { label: 'Ready',           color: c.green,   bg: c.greenBg   },
  picking_up: { label: 'Driver coming',   color: c.terra,   bg: c.terraBg   },
  delivering: { label: 'Out for delivery',color: c.terra,   bg: c.terraBg   },
  delivered:  { label: 'Delivered',       color: c.stone,   bg: c.cream     },
  cancelled:  { label: 'Cancelled',       color: c.terra,   bg: c.terraBg   },
}

interface OrderGroup {
  order: Record<string, unknown>
  items: Record<string, unknown>[]
}

function OrderCard({ group, userId }: { group: OrderGroup; userId: string }) {
  const [isPending, startTransition] = useTransition()
  const order = group.order as {
    id: string
    order_number: number
    status: string
    delivery_address: string
    created_at: string
    scheduled_date: string | null
    scheduled_slot: string | null
    fulfillment_type: string | null
    bazaar_profiles: { full_name: string; phone: string } | null
  }
  const isPickup = order.fulfillment_type === 'pickup'
  const items = group.items as { product_name: string; quantity: number; unit_price: number }[]
  const total = items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const status = STATUS_META[order.status] ?? { label: order.status, color: c.stone, bg: c.cream }

  return (
    <div className="rounded-[14px] p-5" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="font-[family-name:var(--font-dm-sans)] text-[15px] font-medium" style={{ color: c.charcoal }}>
            Order #{order.order_number}
          </span>
          <span
            className="px-2 py-0.5 rounded-[4px] font-[family-name:var(--font-dm-mono)] text-[10px] font-medium"
            style={{ background: status.bg, color: status.color }}
          >
            {status.label}
          </span>
          {isPickup && (
            <span className="px-2 py-0.5 rounded-[4px] font-[family-name:var(--font-dm-mono)] text-[10px] font-medium" style={{ background: c.greenBg, color: c.green }}>
              Pickup
            </span>
          )}
        </div>
        <span className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ color: c.green }}>
          {formatIQD(total)}
        </span>
      </div>

      <div className="mb-3">
        <div className="font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ color: c.stone }}>
          {order.bazaar_profiles?.full_name ?? 'Customer'} — {order.bazaar_profiles?.phone ?? ''}
        </div>
        <div className="font-[family-name:var(--font-dm-mono)] text-[10px] mt-0.5" style={{ color: c.stone }}>
          {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </div>
        {order.scheduled_slot && (
          <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-[6px] font-[family-name:var(--font-dm-sans)] text-[11px]" style={{ background: 'rgba(232,168,56,0.1)', color: '#E8A838' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
            </svg>
            Scheduled: {order.scheduled_date ? new Date(order.scheduled_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : ''} · {order.scheduled_slot}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 mb-4 pb-3" style={{ borderBottom: `1px solid ${c.cream}` }}>
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ color: c.charcoal }}>
            <span>{item.quantity}× {item.product_name}</span>
            <span style={{ color: c.stone }}>{formatIQD(item.unit_price * item.quantity)}</span>
          </div>
        ))}
      </div>

      {order.status === 'pending' && (
        <button
          onClick={() => startTransition(() => { acceptShopOrder(order.id) })}
          disabled={isPending}
          className="w-full py-2.5 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[13px] font-medium border-none cursor-pointer"
          style={{ background: c.green, color: '#fff', opacity: isPending ? 0.7 : 1 }}
        >
          {isPending ? 'Accepting...' : '✓ Accept order'}
        </button>
      )}

      {order.status === 'confirmed' && (
        <button
          onClick={() => startTransition(() => { markShopOrderReady(order.id) })}
          disabled={isPending}
          className="w-full py-2.5 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[13px] font-medium border-none cursor-pointer"
          style={{ background: c.saffron, color: '#fff', opacity: isPending ? 0.7 : 1 }}
        >
          {isPending ? 'Updating...' : '📦 Mark ready for pickup'}
        </button>
      )}

      {order.status === 'ready' && isPickup && (
        <button
          onClick={() => startTransition(() => { markPickupCollected(order.id) })}
          disabled={isPending}
          className="w-full py-2.5 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[13px] font-medium border-none cursor-pointer"
          style={{ background: c.green, color: '#fff', opacity: isPending ? 0.7 : 1 }}
        >
          {isPending ? 'Updating...' : 'Customer collected — mark done'}
        </button>
      )}

      {order.status === 'ready' && !isPickup && (
        <div className="w-full py-2.5 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[13px] text-center"
          style={{ background: c.greenBg, color: c.green }}>
          Waiting for driver
        </div>
      )}

      {(order.status === 'picking_up' || order.status === 'delivering') && (
        <div className="w-full py-2.5 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[13px] text-center"
          style={{ background: c.terraBg, color: c.terra }}>
          {order.status === 'picking_up' ? 'Driver is picking up' : 'Out for delivery'}
        </div>
      )}

      {order.status !== 'cancelled' && (
        <div className="mt-3">
          <OrderChat orderId={order.id} currentUserId={userId} />
        </div>
      )}
    </div>
  )
}

export function ShopOrderList({ orders, userId }: { orders: OrderGroup[]; userId: string }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-[14px] p-8 text-center" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
        <p className="font-[family-name:var(--font-dm-sans)] text-[14px]" style={{ color: c.stone }}>
          No orders yet. They will appear here when customers order from your shop.
        </p>
      </div>
    )
  }

  const active = orders.filter(g => !['delivered', 'cancelled'].includes(g.order.status as string))
  const past   = orders.filter(g =>  ['delivered', 'cancelled'].includes(g.order.status as string))

  return (
    <div className="flex flex-col gap-8">
      {active.length > 0 && (
        <div>
          <h2 className="font-[family-name:var(--font-dm-sans)] text-[16px] font-medium mb-4" style={{ color: c.charcoal }}>
            Active orders
          </h2>
          <div className="flex flex-col gap-4">
            {active.map(g => <OrderCard key={g.order.id as string} group={g} userId={userId} />)}
          </div>
        </div>
      )}
      {past.length > 0 && (
        <div>
          <h2 className="font-[family-name:var(--font-dm-sans)] text-[16px] font-medium mb-4" style={{ color: c.stone }}>
            Past orders
          </h2>
          <div className="flex flex-col gap-4">
            {past.map(g => <OrderCard key={g.order.id as string} group={g} userId={userId} />)}
          </div>
        </div>
      )}
    </div>
  )
}
