'use client'

import { useTransition } from 'react'
import { acceptShopOrder, markShopOrderReady, markPickupCollected, cancelShopOrder } from '@/lib/bazaar/order-actions'
import { OrderChat } from '@/app/components/order-chat'
import { ClientDate } from '@/app/components/client-date'
import { useState } from 'react'

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
          <ClientDate date={order.created_at} />
        </div>
        {order.scheduled_slot && (
          <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-[6px] font-[family-name:var(--font-dm-sans)] text-[11px]" style={{ background: 'rgba(232,168,56,0.1)', color: '#E8A838' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
            </svg>
            Scheduled: {order.scheduled_date ? <ClientDate date={order.scheduled_date} format="scheduled" /> : ''} · {order.scheduled_slot}
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

      {/* Shop Owner Cancellation Button */}
      {['pending', 'confirmed', 'ready'].includes(order.status) && (
        <button
          onClick={() => {
            if (confirm('Cancel this order? This action cannot be undone.')) {
              startTransition(() => { cancelShopOrder(order.id) })
            }
          }}
          disabled={isPending}
          className="w-full mt-2 py-2 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[12px] font-medium cursor-pointer transition-all"
          style={{
            background: 'transparent',
            border: `1px solid ${c.terra}`,
            color: c.terra,
            opacity: isPending ? 0.5 : 1,
          }}
        >
          ✕ Cancel order
        </button>
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
  const [activeTab, setActiveTab] = useState<'new' | 'preparing' | 'past'>('new')

  if (orders.length === 0) {
    return (
      <div className="rounded-[14px] p-8 text-center" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
        <p className="font-[family-name:var(--font-dm-sans)] text-[14px]" style={{ color: c.stone }}>
          No orders yet. They will appear here when customers order from your shop.
        </p>
      </div>
    )
  }

  // Filter orders by tab
  const newOrders = orders.filter(g => g.order.status === 'pending')
  const preparingOrders = orders.filter(g => ['confirmed', 'ready', 'picking_up', 'delivering'].includes(g.order.status as string))
  const pastOrders = orders.filter(g => ['delivered', 'cancelled'].includes(g.order.status as string))

  const activeOrders = activeTab === 'new'
    ? newOrders
    : activeTab === 'preparing'
      ? preparingOrders
      : pastOrders

  const tabs = [
    { id: 'new' as const, label: 'New Received', count: newOrders.length, color: c.saffron },
    { id: 'preparing' as const, label: 'Preparing & Ready', count: preparingOrders.length, color: c.green },
    { id: 'past' as const, label: 'Delivered & Past', count: pastOrders.length, color: c.stone },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Premium Tab Bar */}
      <div className="flex border-b pb-1 gap-2 overflow-x-auto" style={{ borderColor: c.cream2 }}>
        {tabs.map(t => {
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="flex items-center gap-1.5 pb-2.5 px-3 font-[family-name:var(--font-dm-sans)] text-[14px] font-medium border-none cursor-pointer bg-transparent relative transition-all"
              style={{
                color: isActive ? c.charcoal : c.stone,
                borderBottom: isActive ? `2px solid ${c.charcoal}` : '2px solid transparent',
                marginBottom: '-1px'
              }}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-bold font-[family-name:var(--font-dm-mono)]"
                  style={{
                    background: isActive ? 'rgba(30,28,25,0.1)' : 'rgba(122,117,110,0.1)',
                    color: isActive ? c.charcoal : c.stone
                  }}
                >
                  {t.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Orders List / Empty State */}
      {activeOrders.length === 0 ? (
        <div className="rounded-[14px] p-12 text-center" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: c.cream }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c.stone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <p className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium mb-1" style={{ color: c.charcoal }}>
            No {activeTab} orders
          </p>
          <p className="font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ color: c.stone }}>
            {activeTab === 'new'
              ? 'New orders will show up here as soon as they are placed.'
              : activeTab === 'preparing'
                ? 'Orders you accept and mark ready for pickup will appear here.'
                : 'Your order history will be shown here.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {activeOrders.map(g => (
            <OrderCard key={g.order.id as string} group={g} userId={userId} />
          ))}
        </div>
      )}
    </div>
  )
}

