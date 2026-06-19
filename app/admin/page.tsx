import { getAdminStats } from '@/lib/bazaar/admin-actions'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  saffron:  '#E8A838',
  saffronBg:'rgba(232,168,56,0.08)',
  terra:    '#C4654A',
  terraBg:  'rgba(196,101,74,0.08)',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
} as const

export default async function AdminOverview() {
  const stats = await getAdminStats()

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, color: c.green, bg: c.greenBg },
    { label: 'Total Shops', value: stats.totalShops, color: c.green, bg: c.greenBg },
    { label: 'Total Products', value: stats.totalProducts, color: c.saffron, bg: c.saffronBg },
    { label: 'Total Orders', value: stats.totalOrders, color: c.terra, bg: c.terraBg },
  ]

  return (
    <div>
      <h1 className="font-[family-name:var(--font-dm-sans)] text-[28px] font-medium mb-1" style={{ color: c.charcoal }}>
        Admin Dashboard
      </h1>
      <p className="font-[family-name:var(--font-dm-sans)] text-[14px] mb-8" style={{ color: c.stone }}>
        Bazaar Amedi marketplace overview
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(s => (
          <div key={s.label} className="rounded-[14px] p-5" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
            <div className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase mb-2" style={{ color: c.stone }}>
              {s.label}
            </div>
            <div className="font-[family-name:var(--font-dm-sans)] text-[28px] font-medium" style={{ color: s.color }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {stats.pendingShops > 0 && (
        <div className="rounded-[14px] p-5" style={{ background: c.saffronBg, border: '1px solid rgba(232,168,56,0.2)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(232,168,56,0.15)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c.saffron} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: c.charcoal }}>
                {stats.pendingShops} shop{stats.pendingShops !== 1 ? 's' : ''} pending approval
              </div>
              <a href="/admin/shops" className="font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ color: c.saffron }}>
                Review now
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
