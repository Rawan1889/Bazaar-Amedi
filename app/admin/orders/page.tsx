export const dynamic = 'force-dynamic'
import { getAllOrders } from '@/lib/bazaar/admin-actions'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  terra:    '#C4654A',
  terraBg:  'rgba(196,101,74,0.08)',
  saffron:  '#E8A838',
  saffronBg:'rgba(232,168,56,0.08)',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
} as const

function formatIQD(amount: number) {
  return new Intl.NumberFormat('en-IQ').format(amount) + ' IQD'
}

const statusColors: Record<string, { bg: string; color: string }> = {
  pending:     { bg: c.saffronBg, color: c.saffron },
  confirmed:   { bg: c.greenBg, color: c.green },
  picking_up:  { bg: c.saffronBg, color: c.saffron },
  delivering:  { bg: c.greenBg, color: c.green },
  delivered:   { bg: c.greenBg, color: c.green },
  cancelled:   { bg: c.terraBg, color: c.terra },
}

export default async function AdminOrdersPage() {
  const orders = await getAllOrders()

  return (
    <div>
      <h1 className="font-[family-name:var(--font-dm-sans)] text-[28px] font-medium mb-1" style={{ color: c.charcoal }}>
        All Orders
      </h1>
      <p className="font-[family-name:var(--font-dm-sans)] text-[14px] mb-8" style={{ color: c.stone }}>
        {orders.length} order{orders.length !== 1 ? 's' : ''} across all shops
      </p>

      {orders.length === 0 ? (
        <div className="rounded-[14px] p-8 text-center" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
          <p className="font-[family-name:var(--font-dm-sans)] text-[14px]" style={{ color: c.stone }}>
            No orders yet.
          </p>
        </div>
      ) : (
        <div className="rounded-[14px] overflow-hidden" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
          {(orders as Record<string, unknown>[]).map((order) => {
            const o = order as {
              id: string; order_number: number; status: string; total: number; delivery_address: string; created_at: string
              bazaar_profiles: { full_name: string; phone: string }
              bazaar_order_items: { product_name: string; quantity: number; unit_price: number; bazaar_shops: { name: string } }[]
            }
            const sc = statusColors[o.status] || statusColors.pending

            return (
              <div key={o.id} className="px-5 py-4" style={{ borderBottom: `1px solid ${c.cream2}` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: c.charcoal }}>
                      #{o.order_number}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-[4px] font-[family-name:var(--font-dm-mono)] text-[10px] font-medium"
                      style={{ background: sc.bg, color: sc.color }}
                    >
                      {o.status.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ color: c.green }}>
                    {formatIQD(o.total)}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ color: c.stone }}>
                    {o.bazaar_profiles?.full_name}
                  </span>
                  <span className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>
                    {o.bazaar_order_items?.length || 0} items from {[...new Set(o.bazaar_order_items?.map(i => i.bazaar_shops?.name))].join(', ')}
                  </span>
                  <span className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>
                    {new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
