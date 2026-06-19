'use client'

import { useTransition } from 'react'
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
  note: string | null
  created_at: string
  bazaar_order_items: { product_name: string; quantity: number; pickup_status: string; bazaar_shops: { name: string; address: string | null } }[]
  bazaar_profiles: { full_name: string; phone: string }
}

function ActiveOrderCard({ order }: { order: Order }) {
  const [isPending, startTransition] = useTransition()

  const shopStops = [...new Map(
    order.bazaar_order_items.map(i => [i.bazaar_shops.name, i.bazaar_shops])
  ).entries()]

  const nextStatus = order.status === 'confirmed' ? 'picking_up'
    : order.status === 'picking_up' ? 'delivering'
    : order.status === 'delivering' ? 'delivered' : null

  const nextLabel = order.status === 'confirmed' ? 'Start pickup'
    : order.status === 'picking_up' ? 'All picked up — Start delivery'
    : order.status === 'delivering' ? 'Mark delivered' : null

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
        {order.note && (
          <div className="font-[family-name:var(--font-dm-sans)] text-[11px] mt-1" style={{ color: c.saffron }}>
            Note: {order.note}
          </div>
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

      {nextStatus && (
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
