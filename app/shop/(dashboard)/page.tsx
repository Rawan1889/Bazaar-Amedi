export const dynamic = 'force-dynamic'
import { createBazaarServer } from '@/lib/bazaar/supabase-server'
import { getBazaarUser } from '@/lib/bazaar/auth'

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

export default async function ShopDashboard() {
  const user = await getBazaarUser()
  const supabase = await createBazaarServer()

  const { data: shop } = await supabase
    .from('bazaar_shops')
    .select('*, bazaar_categories(name_en)')
    .eq('owner_id', user!.id)
    .single()

  const { count: productCount } = await supabase
    .from('bazaar_products')
    .select('*', { count: 'exact', head: true })
    .eq('shop_id', shop?.id || '')

  const stats = [
    { label: 'Products', value: productCount ?? 0, color: c.green, bg: c.greenBg },
    { label: 'Status', value: shop?.is_approved ? 'Approved' : 'Pending', color: shop?.is_approved ? c.green : c.saffron, bg: shop?.is_approved ? c.greenBg : c.saffronBg },
    { label: 'Shop', value: shop?.is_open ? 'Open' : 'Closed', color: shop?.is_open ? c.green : c.terra, bg: shop?.is_open ? c.greenBg : c.terraBg },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-dm-sans)] text-[28px] font-medium mb-1" style={{ color: c.charcoal }}>
          Welcome back, {user!.full_name.split(' ')[0]}
        </h1>
        <p className="font-[family-name:var(--font-dm-sans)] text-[14px]" style={{ color: c.stone }}>
          {shop ? `Managing ${shop.name}` : 'Set up your shop to get started'}
        </p>
      </div>

      {!shop && (
        <div
          className="rounded-[14px] p-6 mb-6"
          style={{ background: c.saffronBg, border: `1px solid rgba(232,168,56,0.2)` }}
        >
          <h3 className="font-[family-name:var(--font-dm-sans)] text-[16px] font-medium mb-1" style={{ color: c.charcoal }}>
            Complete your shop setup
          </h3>
          <p className="font-[family-name:var(--font-dm-sans)] text-[13px] mb-3" style={{ color: c.stone }}>
            Go to Settings to add your shop details, then start adding products.
          </p>
          <a
            href="/shop/settings"
            className="inline-block px-4 py-2 rounded-[8px] no-underline font-[family-name:var(--font-dm-sans)] text-[13px] font-medium"
            style={{ background: c.saffron, color: '#fff' }}
          >
            Go to settings
          </a>
        </div>
      )}

      {shop && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map(s => (
            <div
              key={s.label}
              className="rounded-[14px] p-5"
              style={{ background: c.white, border: `1px solid ${c.cream2}` }}
            >
              <div className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase mb-2" style={{ color: c.stone }}>
                {s.label}
              </div>
              <div className="font-[family-name:var(--font-dm-sans)] text-[24px] font-medium" style={{ color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {shop && !shop.is_approved && (
        <div
          className="rounded-[14px] p-5"
          style={{ background: c.saffronBg, border: `1px solid rgba(232,168,56,0.15)` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(232,168,56,0.15)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c.saffron} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: c.charcoal }}>
                Your shop is pending approval
              </div>
              <div className="font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ color: c.stone }}>
                You can still add products while waiting. Your shop will be visible to customers once approved.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
