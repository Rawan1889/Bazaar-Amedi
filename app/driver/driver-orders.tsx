'use client'

import { useState, useTransition } from 'react'
import { acceptOrder, updateOrderStatus } from '@/lib/bazaar/order-actions'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  terra:    '#C4654A',
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

interface Order {
  id: string
  order_number: number
  status: string
  total: number
  delivery_fee: number
  delivery_address: string
  delivery_lat: number | null
  delivery_lng: number | null
  scheduled_date: string | null
  scheduled_slot: string | null
  note: string | null
  created_at: string
  bazaar_order_items: { product_name: string; quantity: number; pickup_status: string; bazaar_shops: { name: string; address: string | null } }[]
  bazaar_profiles: { full_name: string; phone: string }
}

function ActiveOrderCard({ order }: { order: Order }) {
  const [isPending, startTransition] = useTransition()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const shopStops = [...new Map(
    order.bazaar_order_items.map(i => [i.bazaar_shops.name, i.bazaar_shops])
  ).entries()]

  const nextStatus = order.status === 'confirmed' ? 'picking_up'
    : order.status === 'picking_up' ? 'delivering'
    : order.status === 'delivering' ? 'delivered' : null

  const nextLabel = order.status === 'picking_up' ? 'All picked up — Start delivery'
    : order.status === 'delivering' ? 'Mark as delivered' : null

  return (
    <div className="rounded-[14px] p-5" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-[family-name:var(--font-dm-sans)] text-[15px] font-medium" style={{ color: c.charcoal }}>
          Order #{order.order_number}
        </span>
        <span className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: c.green }}>
          {formatIQD(order.total)}
        </span>
      </div>

      <div className="mb-3 pb-3" style={{ borderBottom: `1px solid ${c.cream}` }}>
        <div className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase mb-2" style={{ color: c.stone }}>
          Pickup route
        </div>
        {shopStops.map(([name, shop], idx) => (
          <div key={name} className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center font-[family-name:var(--font-dm-mono)] text-[9px]" style={{ background: c.greenBg, color: c.green }}>
              {idx + 1}
            </div>
            <div>
              <span className="font-[family-name:var(--font-dm-sans)] text-[12px] font-medium" style={{ color: c.charcoal }}>{name}</span>
              {shop.address && (
                <span className="font-[family-name:var(--font-dm-sans)] text-[10px] ml-2" style={{ color: c.stone }}>{shop.address}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-3 pb-3" style={{ borderBottom: `1px solid ${c.cream}` }}>
        <div className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase mb-1" style={{ color: c.stone }}>
          Deliver to
        </div>
        <div className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.charcoal }}>
          {order.bazaar_profiles.full_name} — {order.delivery_address}
        </div>
        <div className="font-[family-name:var(--font-dm-mono)] text-[11px]" style={{ color: c.stone }}>
          {order.bazaar_profiles.phone}
        </div>
        {order.scheduled_slot && (
          <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-[6px] font-[family-name:var(--font-dm-sans)] text-[11px]" style={{ background: c.saffronBg, color: c.saffron }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
            </svg>
            {order.scheduled_date ? new Date(order.scheduled_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : ''} · {order.scheduled_slot}
          </div>
        )}
        {order.note && (
          <div className="font-[family-name:var(--font-dm-sans)] text-[11px] mt-1" style={{ color: c.saffron }}>
            Note: {order.note}
          </div>
        )}
        {order.delivery_lat != null && order.delivery_lng != null && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${order.delivery_lat},${order.delivery_lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-[8px] no-underline font-[family-name:var(--font-dm-sans)] text-[12px] font-medium"
            style={{ background: c.greenBg, color: c.green }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            Navigate to customer
          </a>
        )}
      </div>

      <div className="mb-4">
        <div className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase mb-1" style={{ color: c.stone }}>Items</div>
        {order.bazaar_order_items.map((item, idx) => (
          <div key={idx} className="font-[family-name:var(--font-dm-sans)] text-[12px] flex justify-between" style={{ color: c.stone }}>
            <span>{item.quantity}x {item.product_name} <span style={{ color: c.cream2 }}>({item.bazaar_shops.name})</span></span>
            <span className="font-[family-name:var(--font-dm-mono)] text-[10px] px-1.5 py-0.5 rounded" style={{
              background: item.pickup_status === 'picked_up' ? c.greenBg : c.saffronBg,
              color: item.pickup_status === 'picked_up' ? c.green : c.saffron,
            }}>
              {item.pickup_status === 'picked_up' ? 'Picked' : 'Pending'}
            </span>
          </div>
        ))}
      </div>

      {nextStatus === 'delivered' ? (
        <div className="flex flex-col gap-2">
          <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
            Ask the customer for their 4-digit code
          </label>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={e => { setCode(e.target.value); setError(null) }}
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              className="w-24 px-3 py-2.5 rounded-[10px] text-center tracking-[0.3em] font-[family-name:var(--font-dm-mono)] text-[15px] outline-none"
              style={{ border: `1px solid ${c.cream2}`, color: c.charcoal }}
            />
            <button
              onClick={() => startTransition(async () => {
                const res = await updateOrderStatus(order.id, 'delivered', code)
                if (res?.error) setError(res.error)
              })}
              disabled={isPending || code.trim().length < 4}
              className="flex-1 py-2.5 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[13px] font-medium border-none cursor-pointer"
              style={{ background: code.trim().length < 4 ? c.cream2 : c.green, color: '#fff', opacity: isPending ? 0.7 : 1, cursor: code.trim().length < 4 ? 'not-allowed' : 'pointer' }}
            >
              {isPending ? 'Confirming…' : 'Confirm delivery'}
            </button>
          </div>
          {error && (
            <p className="font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ color: c.terra }}>{error}</p>
          )}
        </div>
      ) : nextStatus && (
        <button
          onClick={() => startTransition(() => { updateOrderStatus(order.id, nextStatus) })}
          disabled={isPending}
          className="w-full py-2.5 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[13px] font-medium border-none cursor-pointer"
          style={{ background: c.green, color: '#fff', opacity: isPending ? 0.7 : 1 }}
        >
          {isPending ? 'Updating...' : nextLabel}
        </button>
      )}
    </div>
  )
}

function AvailableOrderCard({ order }: { order: Order }) {
  const [isPending, startTransition] = useTransition()

  const shopNames = [...new Set(order.bazaar_order_items.map(i => i.bazaar_shops.name))]

  return (
    <div className="rounded-[14px] p-5" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: c.charcoal }}>
          Order #{order.order_number}
        </span>
        <span className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ color: c.green }}>
          {formatIQD(order.delivery_fee)} fee
        </span>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>
          {shopNames.length} shop{shopNames.length !== 1 ? 's' : ''}: {shopNames.join(', ')}
        </span>
      </div>
      <div className="font-[family-name:var(--font-dm-sans)] text-[12px] mb-3" style={{ color: c.stone }}>
        {order.bazaar_order_items.length} items → {order.delivery_address}
      </div>

      <button
        onClick={() => startTransition(() => { acceptOrder(order.id) })}
        disabled={isPending}
        className="w-full py-2.5 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[13px] font-medium border-none cursor-pointer"
        style={{ background: c.green, color: '#fff', opacity: isPending ? 0.7 : 1 }}
      >
        {isPending ? 'Accepting...' : 'Accept delivery'}
      </button>
    </div>
  )
}

export function DriverOrderList({ active, available }: { active: Order[]; available: Order[] }) {
  return (
    <div className="flex flex-col gap-8">
      {active.length > 0 && (
        <div>
          <h2 className="font-[family-name:var(--font-dm-sans)] text-[18px] font-medium mb-4" style={{ color: c.charcoal }}>
            Active deliveries
          </h2>
          <div className="flex flex-col gap-4">
            {active.map(order => <ActiveOrderCard key={order.id} order={order as Order} />)}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-[family-name:var(--font-dm-sans)] text-[18px] font-medium mb-4" style={{ color: c.charcoal }}>
          Available orders
        </h2>
        {available.length === 0 ? (
          <div className="rounded-[14px] p-8 text-center" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
            <p className="font-[family-name:var(--font-dm-sans)] text-[14px]" style={{ color: c.stone }}>
              No orders available right now. Check back soon.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {available.map(order => <AvailableOrderCard key={order.id} order={order as Order} />)}
          </div>
        )}
      </div>
    </div>
  )
}
