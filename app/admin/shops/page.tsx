import { getAllShops } from '@/lib/bazaar/admin-actions'
import { ShopList } from './shop-list'

export default async function AdminShopsPage() {
  const shops = await getAllShops()

  const pending = shops.filter((s: Record<string, unknown>) => !s.is_approved)
  const approved = shops.filter((s: Record<string, unknown>) => s.is_approved)

  return (
    <div>
      <h1 className="font-[family-name:var(--font-dm-sans)] text-[28px] font-medium mb-1" style={{ color: '#1E1C19' }}>
        Shops
      </h1>
      <p className="font-[family-name:var(--font-dm-sans)] text-[14px] mb-8" style={{ color: '#7A756E' }}>
        {shops.length} total, {pending.length} pending approval
      </p>

      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="font-[family-name:var(--font-dm-sans)] text-[18px] font-medium mb-4" style={{ color: '#1E1C19' }}>
            Pending Approval
          </h2>
          <ShopList shops={pending} showActions />
        </div>
      )}

      {approved.length > 0 && (
        <div>
          <h2 className="font-[family-name:var(--font-dm-sans)] text-[18px] font-medium mb-4" style={{ color: '#1E1C19' }}>
            Approved Shops
          </h2>
          <ShopList shops={approved} showActions={false} />
        </div>
      )}
    </div>
  )
}
