'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { useTransition } from 'react'
import { ReorderButton } from '@/app/components/reorder-button'
import { cancelOrder } from '@/lib/bazaar/order-actions'
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

const statusColors: Record<string, { color: string; bg: string; label: string }> = {
  pending:     { color: c.saffron, bg: c.saffronBg, label: 'Pending' },
  confirmed:   { color: c.green, bg: c.greenBg, label: 'Preparing' },
  ready:       { color: c.green, bg: c.greenBg, label: 'Ready — awaiting driver' },
  picking_up:  { color: '#6366F1', bg: 'rgba(99,102,241,0.08)', label: 'Picking up' },
  delivering:  { color: '#6366F1', bg: 'rgba(99,102,241,0.08)', label: 'On the way' },
  delivered:   { color: c.green, bg: c.greenBg, label: 'Delivered' },
  cancelled:   { color: c.terra, bg: c.terraBg, label: 'Cancelled' },
}

type OrderItem = { product_id: string; product_name: string; quantity: number; unit_price: number; shop_id: string; bazaar_shops: { name: string; slug: string } }

type Order = {
  id: string; order_number: number; status: string; total: number; delivery_fee: number
  delivery_address: string; created_at: string
  bazaar_order_items: OrderItem[]
}

function OrderCard({ o }: { o: Order }) {
  const [isPending, startTransition] = useTransition()
  const st = statusColors[o.status] || statusColors.pending
  const shopNames = [...new Set(o.bazaar_order_items?.map(i => i.bazaar_shops?.name))]

  return (
    <div className="rounded-[14px] p-5 transition-all duration-150" style={{ background: c.white, border: `1px solid ${c.cream2}`, opacity: isPending ? 0.6 : 1 }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Link href={`/orders/${o.id}` as Route} className="font-[family-name:var(--font-dm-sans)] text-[15px] font-medium no-underline" style={{ color: c.charcoal }}>
            Order #{o.order_number}
          </Link>
          <span
            className="px-2 py-0.5 rounded-[4px] font-[family-name:var(--font-dm-mono)] text-[10px] font-medium"
            style={{ background: st.bg, color: st.color }}
          >
            {st.label}
          </span>
        </div>
        <span className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: c.green }}>
          {formatIQD(o.total)}
        </span>
      </div>

      <div className="flex flex-col gap-1 mb-3">
        {o.bazaar_order_items?.map((item, idx) => (
          <div key={idx} className="flex justify-between font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ color: c.stone }}>
            <span>{item.quantity}x {item.product_name}</span>
            <span>{formatIQD(item.unit_price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${c.cream}` }}>
        <div className="flex items-center gap-4">
          <span className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>
            {shopNames.join(' + ')}
          </span>
          <span className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>
            <ClientDate date={o.created_at} />
          </span>
        </div>
        <div className="flex items-center gap-2">
          {o.status === 'pending' && (
            <button
              onClick={() => {
                if (confirm('Cancel this order?')) {
                  startTransition(() => { cancelOrder(o.id) })
                }
              }}
              disabled={isPending}
              className="font-[family-name:var(--font-dm-sans)] text-[11px] border-none bg-transparent cursor-pointer px-0"
              style={{ color: c.terra }}
            >
              Cancel
            </button>
          )}
          {(o.status === 'delivered' || o.status === 'cancelled') && o.bazaar_order_items?.length > 0 && (
            <ReorderButton items={o.bazaar_order_items} />
          )}
          <Link href={`/orders/${o.id}` as Route} className="font-[family-name:var(--font-dm-sans)] text-[11px] no-underline" style={{ color: c.green }}>
            View details
          </Link>
        </div>
      </div>
    </div>
  )
}

interface Props {
  orders: unknown[]
}

export function OrderList({ orders }: Props) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="font-[family-name:var(--font-dm-sans)] text-[15px] mb-4" style={{ color: c.stone }}>
          No orders yet. Start shopping!
        </p>
        <Link
          href="/browse"
          className="inline-block px-5 py-2.5 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[13px] font-medium no-underline"
          style={{ background: c.green, color: '#fff' }}
        >
          Browse markets
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {orders.map((order: unknown) => (
        <OrderCard key={(order as Order).id} o={order as Order} />
      ))}
    </div>
  )
}
