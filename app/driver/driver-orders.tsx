'use client'

import { useState, useTransition } from 'react'
import { acceptOrder, updateOrderStatus, setDriverOnline } from '@/lib/bazaar/order-actions'
import { useRealtimeAvailableOrders } from '@/lib/bazaar/use-realtime-orders'
import { OrderChat } from '@/app/components/order-chat'
import { ClientDate } from '@/app/components/client-date'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  terra:    '#C4654A',
  terraBg:  'rgba(196,101,74,0.08)',
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
  bazaar_profiles: { full_name: string; phone: string } | null
}

// ──────────────────────────────────────────────
// Online / Offline toggle pill
// ──────────────────────────────────────────────
function OnlineToggle({ isOnline }: { isOnline: boolean }) {
  const [online, setOnline] = useState(isOnline)
  const [isPending, startTransition] = useTransition()

  function toggle() {
    const next = !online
    startTransition(async () => {
      const res = await setDriverOnline(next)
      if (!res?.error) setOnline(next)
    })
  }

  return (
    <div className="flex items-center justify-between mb-8 p-4 rounded-[14px]"
      style={{ background: online ? c.greenBg : c.cream, border: `1px solid ${online ? 'rgba(45,138,94,0.25)' : c.cream2}` }}
    >
      <div>
        <div className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: online ? c.green : c.charcoal }}>
          {online ? "You're online" : "You're offline"}
        </div>
        <div className="font-[family-name:var(--font-dm-sans)] text-[12px] mt-0.5" style={{ color: c.stone }}>
          {online ? 'Receiving orders & push notifications' : 'Not receiving orders or notifications'}
        </div>
      </div>

      {/* Toggle switch */}
      <button
        onClick={toggle}
        disabled={isPending}
        aria-label={online ? 'Go offline' : 'Go online'}
        className="relative flex-shrink-0 w-12 h-6 rounded-full border-none cursor-pointer transition-all duration-300"
        style={{
          background: online ? c.green : c.cream2,
          opacity: isPending ? 0.6 : 1,
        }}
      >
        <span
          className="absolute top-[2px] w-5 h-5 rounded-full transition-all duration-300"
          style={{
            background: c.white,
            left: online ? 'calc(100% - 22px)' : '2px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          }}
        />
      </button>
    </div>
  )
}

// ──────────────────────────────────────────────
// Offline screen (Option B — hides all orders)
// ──────────────────────────────────────────────
function OfflineScreen({ isOnline }: { isOnline: boolean }) {
  return (
    <div className="flex flex-col gap-6">
      <OnlineToggle isOnline={isOnline} />
      <div className="rounded-[14px] p-10 text-center" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: c.cream }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c.stone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h8M12 8v8" />
          </svg>
        </div>
        <h2 className="font-[family-name:var(--font-dm-sans)] text-[18px] font-medium mb-2" style={{ color: c.charcoal }}>
          You're offline
        </h2>
        <p className="font-[family-name:var(--font-dm-sans)] text-[13px] max-w-[280px] mx-auto" style={{ color: c.stone }}>
          Toggle online above to start receiving delivery requests and push notifications.
        </p>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Toast for race-condition errors
// ──────────────────────────────────────────────
function ErrorToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-[12px] flex items-center gap-3 shadow-lg"
      style={{ background: c.terra, color: '#fff', maxWidth: '90vw' }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
      </svg>
      <span className="font-[family-name:var(--font-dm-sans)] text-[13px] flex-1">{message}</span>
      <button onClick={onDismiss} className="bg-transparent border-none cursor-pointer p-0" style={{ color: 'rgba(255,255,255,0.7)' }}>✕</button>
    </div>
  )
}

// ──────────────────────────────────────────────
// PreparingCard — order confirmed by shop, not yet ready
// ──────────────────────────────────────────────
function PreparingCard({ order }: { order: Order }) {
  const shopNames = [...new Set(order.bazaar_order_items.map(i => i.bazaar_shops.name))]

  return (
    <div className="rounded-[14px] p-5" style={{ background: c.white, border: `1px solid ${c.saffron}`, opacity: 0.85 }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: c.charcoal }}>
            Order #{order.order_number}
          </span>
          <span className="px-2 py-0.5 rounded-[4px] font-[family-name:var(--font-dm-mono)] text-[10px] font-medium" style={{ background: c.saffronBg, color: c.saffron }}>
            Preparing
          </span>
        </div>
        <span className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ color: c.green }}>
          {formatIQD(order.delivery_fee)} fee
        </span>
      </div>

      <div className="font-[family-name:var(--font-dm-mono)] text-[10px] mb-1" style={{ color: c.stone }}>
        {shopNames.join(' + ')}
      </div>
      <div className="font-[family-name:var(--font-dm-sans)] text-[12px] mb-3" style={{ color: c.stone }}>
        {order.bazaar_order_items.length} items → {order.delivery_address}
      </div>

      <div className="w-full py-2.5 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[13px] text-center" style={{ background: c.saffronBg, color: c.saffron }}>
        Shop is preparing — available soon
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// AvailableOrderCard — ready for driver to claim
// ──────────────────────────────────────────────
function AvailableOrderCard({ order, onError }: { order: Order; onError: (msg: string) => void }) {
  const [isPending, startTransition] = useTransition()
  const shopNames = [...new Set(order.bazaar_order_items.map(i => i.bazaar_shops.name))]

  function handleAccept() {
    startTransition(async () => {
      const res = await acceptOrder(order.id)
      if (res?.error) {
        onError(res.error)
      }
    })
  }

  return (
    <div className="rounded-[14px] p-5" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: c.charcoal }}>
            Order #{order.order_number}
          </span>
          <span className="px-2 py-0.5 rounded-[4px] font-[family-name:var(--font-dm-mono)] text-[10px] font-medium" style={{ background: c.greenBg, color: c.green }}>
            Ready
          </span>
        </div>
        <span className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ color: c.green }}>
          {formatIQD(order.delivery_fee)} fee
        </span>
      </div>

      <div className="font-[family-name:var(--font-dm-mono)] text-[10px] mb-1" style={{ color: c.stone }}>
        {shopNames.join(' + ')}
      </div>
      <div className="font-[family-name:var(--font-dm-sans)] text-[12px] mb-3" style={{ color: c.stone }}>
        {order.bazaar_order_items.length} items → {order.delivery_address}
      </div>

      <button
        onClick={handleAccept}
        disabled={isPending}
        className="w-full py-2.5 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[13px] font-medium border-none cursor-pointer"
        style={{ background: c.green, color: '#fff', opacity: isPending ? 0.7 : 1 }}
      >
        {isPending ? 'Accepting...' : 'Accept & pick up'}
      </button>
    </div>
  )
}

// ──────────────────────────────────────────────
// ActiveOrderCard — driver has accepted, in progress
// ──────────────────────────────────────────────
function ActiveOrderCard({ order, userId }: { order: Order; userId: string }) {
  const [isPending, startTransition] = useTransition()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const shopStops = [...new Map(
    order.bazaar_order_items.map(i => [i.bazaar_shops.name, i.bazaar_shops])
  ).entries()]

  const nextStatus = order.status === 'picking_up' ? 'delivering'
    : order.status === 'delivering' ? 'delivered' : null

  const nextLabel = order.status === 'picking_up' ? 'All picked up — Start delivery'
    : order.status === 'delivering' ? 'Mark as delivered' : null

  const customer = order.bazaar_profiles

  return (
    <div className="rounded-[14px] p-5" style={{ background: c.white, border: `2px solid ${c.green}` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-[family-name:var(--font-dm-sans)] text-[15px] font-medium" style={{ color: c.charcoal }}>
            Order #{order.order_number}
          </span>
          <span className="px-2 py-0.5 rounded-[4px] font-[family-name:var(--font-dm-mono)] text-[10px] font-medium" style={{ background: c.terraBg, color: c.terra }}>
            {order.status === 'picking_up' ? 'Picking up' : 'Delivering'}
          </span>
        </div>
        <span className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: c.green }}>
          {formatIQD(order.total)}
        </span>
      </div>

      {/* Shop pickup stops */}
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

      {/* Deliver to */}
      <div className="mb-3 pb-3" style={{ borderBottom: `1px solid ${c.cream}` }}>
        <div className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase mb-1" style={{ color: c.stone }}>
          Deliver to
        </div>
        <div className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.charcoal }}>
          {customer?.full_name ?? 'Customer'} — {order.delivery_address}
        </div>
        {customer?.phone && (
          <div className="font-[family-name:var(--font-dm-mono)] text-[11px]" style={{ color: c.stone }}>
            {customer.phone}
          </div>
        )}
        {order.scheduled_slot && (
          <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-[6px] font-[family-name:var(--font-dm-sans)] text-[11px]" style={{ background: c.saffronBg, color: c.saffron }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
            </svg>
            {order.scheduled_date ? <ClientDate date={order.scheduled_date} format="scheduled" /> : ''} · {order.scheduled_slot}
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

      {/* Items */}
      <div className="mb-4">
        <div className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase mb-1" style={{ color: c.stone }}>Items</div>
        {order.bazaar_order_items.map((item, idx) => (
          <div key={idx} className="font-[family-name:var(--font-dm-sans)] text-[12px] flex justify-between" style={{ color: c.stone }}>
            <span>{item.quantity}× {item.product_name} <span style={{ color: c.cream2 }}>({item.bazaar_shops.name})</span></span>
            <span className="font-[family-name:var(--font-dm-mono)] text-[10px] px-1.5 py-0.5 rounded" style={{
              background: item.pickup_status === 'picked_up' ? c.greenBg : c.saffronBg,
              color: item.pickup_status === 'picked_up' ? c.green : c.saffron,
            }}>
              {item.pickup_status === 'picked_up' ? 'Picked' : 'Pending'}
            </span>
          </div>
        ))}
      </div>

      {/* Action */}
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

      <div className="mt-3">
        <OrderChat orderId={order.id} currentUserId={userId} />
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Main export
// ──────────────────────────────────────────────
export function DriverOrderList({
  active,
  available,
  userId,
  isOnline,
}: {
  active: Order[]
  available: Order[]
  userId: string
  isOnline: boolean
}) {
  const [toastError, setToastError] = useState<string | null>(null)

  // Live subscription — refreshes the list when orders change. Only when online.
  useRealtimeAvailableOrders(isOnline)

  // Option B: show offline screen when driver is not online
  if (!isOnline) {
    return <OfflineScreen isOnline={false} />
  }

  const preparing = available.filter(o => o.status === 'confirmed')
  const ready     = available.filter(o => o.status === 'ready')
  const isEmpty   = active.length === 0 && preparing.length === 0 && ready.length === 0

  return (
    <div className="flex flex-col gap-8">
      {/* Online toggle at the top */}
      <OnlineToggle isOnline={isOnline} />

      {/* Error toast for race-condition "order already taken" */}
      {toastError && (
        <ErrorToast message={toastError} onDismiss={() => setToastError(null)} />
      )}

      {/* Active deliveries driver already accepted */}
      {active.length > 0 && (
        <div>
          <h2 className="font-[family-name:var(--font-dm-sans)] text-[18px] font-medium mb-4" style={{ color: c.charcoal }}>
            Active deliveries
          </h2>
          <div className="flex flex-col gap-4">
            {active.map(order => <ActiveOrderCard key={order.id} order={order} userId={userId} />)}
          </div>
        </div>
      )}

      {/* Ready — can accept */}
      {ready.length > 0 && (
        <div>
          <h2 className="font-[family-name:var(--font-dm-sans)] text-[18px] font-medium mb-1" style={{ color: c.charcoal }}>
            Ready for pickup
          </h2>
          <p className="font-[family-name:var(--font-dm-sans)] text-[13px] mb-4" style={{ color: c.stone }}>
            Shop has finished packing — accept to pick up.
          </p>
          <div className="flex flex-col gap-4">
            {ready.map(order => (
              <AvailableOrderCard key={order.id} order={order} onError={setToastError} />
            ))}
          </div>
        </div>
      )}

      {/* Preparing — visible but not yet pickable */}
      {preparing.length > 0 && (
        <div>
          <h2 className="font-[family-name:var(--font-dm-sans)] text-[18px] font-medium mb-1" style={{ color: c.charcoal }}>
            Being prepared
          </h2>
          <p className="font-[family-name:var(--font-dm-sans)] text-[13px] mb-4" style={{ color: c.stone }}>
            Shop is packing these orders — they'll move to "Ready" when done.
          </p>
          <div className="flex flex-col gap-4">
            {preparing.map(order => <PreparingCard key={order.id} order={order} />)}
          </div>
        </div>
      )}

      {isEmpty && (
        <div className="rounded-[14px] p-8 text-center" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: c.greenBg }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m-4 12h8a2 2 0 002-2v-3a2 2 0 00-2-2h-8a2 2 0 00-2 2v3a2 2 0 002 2z" />
              <circle cx="7.5" cy="17.5" r="2.5" />
              <circle cx="17.5" cy="17.5" r="2.5" />
            </svg>
          </div>
          <p className="font-[family-name:var(--font-dm-sans)] text-[14px]" style={{ color: c.stone }}>
            No orders right now. Check back soon.
          </p>
        </div>
      )}
    </div>
  )
}
