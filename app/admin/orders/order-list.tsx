'use client'

import { useState } from 'react'
import { OrderActions, OrderFilters } from './order-actions'

const c = {
  green:     '#2D8A5E',
  greenBg:   'rgba(45,138,94,0.08)',
  terra:     '#C4654A',
  terraBg:   'rgba(196,101,74,0.08)',
  saffron:   '#E8A838',
  saffronBg: 'rgba(232,168,56,0.08)',
  charcoal:  '#1E1C19',
  stone:     '#7A756E',
  cream2:    '#E8E4DE',
  white:     '#FFFFFF',
} as const

function formatIQD(amount: number) {
  return new Intl.NumberFormat('en-IQ').format(amount) + ' IQD'
}

const statusColors: Record<string, { bg: string; color: string }> = {
  pending:    { bg: c.saffronBg, color: c.saffron },
  confirmed:  { bg: c.greenBg,   color: c.green   },
  picking_up: { bg: c.saffronBg, color: c.saffron },
  delivering: { bg: c.greenBg,   color: c.green   },
  delivered:  { bg: c.greenBg,   color: c.green   },
  cancelled:  { bg: c.terraBg,   color: c.terra   },
}

type OrderItem = { product_name: string; quantity: number; unit_price: number; bazaar_shops: { name: string } }
type Order = {
  id: string; order_number: number; status: string; total: number
  delivery_address: string; created_at: string
  bazaar_profiles: { full_name: string; phone: string | null }
  bazaar_order_items: OrderItem[]
}

export function OrderList({ orders }: { orders: Order[] }) {
  const [filter, setFilter] = useState('all')

  const counts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1
    return acc
  }, {})

  const visible = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  return (
    <div>
      <OrderFilters active={filter} counts={counts} onChange={setFilter} />

      {visible.length === 0 ? (
        <div className="rounded-[14px] p-8 text-center" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
          <p className="font-[family-name:var(--font-dm-sans)] text-[14px]" style={{ color: c.stone }}>
            No {filter === 'all' ? '' : filter.replace('_', ' ')} orders.
          </p>
        </div>
      ) : (
        <div className="rounded-[14px] overflow-hidden" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
          {visible.map(o => {
            const sc = statusColors[o.status] ?? statusColors.pending
            const shops = [...new Set(o.bazaar_order_items?.map(i => i.bazaar_shops?.name).filter(Boolean))]

            return (
              <div key={o.id} className="px-5 py-4" style={{ borderBottom: `1px solid ${c.cream2}` }}>
                {/* Top row: order # + status + total */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: c.charcoal }}>
                      #{o.order_number}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-[4px] font-[family-name:var(--font-dm-mono)] text-[10px] font-medium capitalize"
                      style={{ background: sc.bg, color: sc.color }}
                    >
                      {o.status.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ color: c.green }}>
                    {formatIQD(o.total)}
                  </span>
                </div>

                {/* Customer + items info */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
                  <span className="font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ color: c.charcoal }}>
                    {o.bazaar_profiles?.full_name}
                  </span>
                  {o.bazaar_profiles?.phone && (
                    <span className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>
                      {o.bazaar_profiles.phone}
                    </span>
                  )}
                  <span className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>
                    {o.bazaar_order_items?.length ?? 0} items · {shops.join(', ') || '—'}
                  </span>
                  <span className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>
                    {new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Items list */}
                {o.bazaar_order_items?.length > 0 && (
                  <div className="rounded-[8px] px-3 py-2 mb-3 flex flex-wrap gap-x-4 gap-y-0.5" style={{ background: 'rgba(30,28,25,0.03)' }}>
                    {o.bazaar_order_items.map((item, idx) => (
                      <span key={idx} className="font-[family-name:var(--font-dm-sans)] text-[11px]" style={{ color: c.stone }}>
                        {item.product_name} × {item.quantity} · {formatIQD(item.unit_price)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Delivery address + actions */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  {o.delivery_address && (
                    <span className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>
                      {o.delivery_address}
                    </span>
                  )}
                  <div className="ml-auto">
                    <OrderActions orderId={o.id} currentStatus={o.status} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
