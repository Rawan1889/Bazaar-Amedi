'use client'

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

interface Props {
  data: {
    shopName: string
    totalRevenue: number
    totalOrders: number
    totalItemsSold: number
    totalProducts: number
    avgRating: number
    reviewCount: number
    topProducts: { name: string; quantity: number; revenue: number }[]
    last7Days: { date: string; revenue: number; orders: number }[]
  }
}

export function AnalyticsDashboard({ data }: Props) {
  const maxRevenue = Math.max(...data.last7Days.map(d => d.revenue), 1)

  return (
    <div>
      <h1 className="font-[family-name:var(--font-dm-sans)] text-[24px] font-medium mb-6" style={{ color: c.charcoal }}>
        Analytics
      </h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Revenue', value: formatIQD(data.totalRevenue), sub: 'from delivered orders', color: c.green },
          { label: 'Orders', value: String(data.totalOrders), sub: 'total order items', color: c.charcoal },
          { label: 'Items sold', value: String(data.totalItemsSold), sub: `from ${data.totalProducts} products`, color: c.saffron },
          { label: 'Rating', value: data.avgRating > 0 ? String(data.avgRating) : '—', sub: data.reviewCount > 0 ? `${data.reviewCount} reviews` : 'No reviews yet', color: c.terra },
        ].map(stat => (
          <div key={stat.label} className="rounded-[14px] p-5" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
            <div className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase mb-2" style={{ color: c.stone }}>
              {stat.label}
            </div>
            <div className="font-[family-name:var(--font-dm-sans)] text-[22px] font-medium mb-0.5" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="font-[family-name:var(--font-dm-sans)] text-[11px]" style={{ color: c.stone }}>
              {stat.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Revenue chart (last 7 days) */}
      <div className="rounded-[14px] p-5 mb-6" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
        <h2 className="font-[family-name:var(--font-dm-sans)] text-[16px] font-medium mb-4" style={{ color: c.charcoal }}>
          Last 7 days
        </h2>
        <div className="flex items-end gap-2 h-[140px]">
          {data.last7Days.map(day => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="font-[family-name:var(--font-dm-mono)] text-[9px]" style={{ color: c.stone }}>
                {day.revenue > 0 ? formatIQD(day.revenue) : ''}
              </div>
              <div
                className="w-full rounded-[4px] transition-all duration-300 min-h-[4px]"
                style={{
                  background: day.revenue > 0 ? c.green : c.cream,
                  height: `${Math.max((day.revenue / maxRevenue) * 100, 3)}%`,
                }}
              />
              <div className="font-[family-name:var(--font-dm-mono)] text-[9px]" style={{ color: c.stone }}>
                {day.date}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top products */}
      <div className="rounded-[14px] p-5" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
        <h2 className="font-[family-name:var(--font-dm-sans)] text-[16px] font-medium mb-4" style={{ color: c.charcoal }}>
          Top products
        </h2>
        {data.topProducts.length === 0 ? (
          <p className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.stone }}>
            No sales data yet.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {data.topProducts.map((product, idx) => (
              <div key={product.name} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-[6px] flex items-center justify-center font-[family-name:var(--font-dm-mono)] text-[10px] font-medium"
                  style={{ background: c.greenBg, color: c.green }}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium truncate" style={{ color: c.charcoal }}>
                    {product.name}
                  </div>
                  <div className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>
                    {product.quantity} sold
                  </div>
                </div>
                <span className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ color: c.green }}>
                  {formatIQD(product.revenue)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
