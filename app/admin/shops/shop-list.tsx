'use client'

import { useTransition } from 'react'
import { approveShop, rejectShop } from '@/lib/bazaar/admin-actions'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  terra:    '#C4654A',
  terraBg:  'rgba(196,101,74,0.08)',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
} as const

interface Shop {
  id: string
  name: string
  slug: string
  phone: string | null
  address: string | null
  is_open: boolean
  is_approved: boolean
  created_at: string
  bazaar_profiles: { full_name: string; phone: string } | null
  bazaar_categories: { name_en: string } | null
}

function ShopCard({ shop, showActions }: { shop: Shop; showActions: boolean }) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="rounded-[14px] p-5" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="font-[family-name:var(--font-dm-sans)] text-[15px] font-medium" style={{ color: c.charcoal }}>
          {shop.name}
        </div>
        <span
          className="px-2 py-0.5 rounded-[4px] font-[family-name:var(--font-dm-mono)] text-[10px] font-medium"
          style={{
            background: shop.is_approved ? c.greenBg : c.terraBg,
            color: shop.is_approved ? c.green : c.terra,
          }}
        >
          {shop.is_approved ? 'Approved' : 'Pending'}
        </span>
      </div>

      <div className="flex flex-col gap-1 mb-3">
        {shop.bazaar_profiles && (
          <div className="font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ color: c.stone }}>
            Owner: {shop.bazaar_profiles.full_name} ({shop.bazaar_profiles.phone})
          </div>
        )}
        {shop.bazaar_categories && (
          <div className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>
            {shop.bazaar_categories.name_en}
          </div>
        )}
        {shop.address && (
          <div className="font-[family-name:var(--font-dm-sans)] text-[11px]" style={{ color: c.stone }}>
            {shop.address}
          </div>
        )}
        <div className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>
          Created {new Date(shop.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>

      {showActions && (
        <div className="flex gap-2">
          <button
            onClick={() => startTransition(() => { approveShop(shop.id) })}
            disabled={isPending}
            className="flex-1 py-2 rounded-[8px] font-[family-name:var(--font-dm-sans)] text-[12px] font-medium border-none cursor-pointer"
            style={{ background: c.green, color: '#fff', opacity: isPending ? 0.7 : 1 }}
          >
            Approve
          </button>
          {shop.is_approved && (
            <button
              onClick={() => startTransition(() => { rejectShop(shop.id) })}
              disabled={isPending}
              className="flex-1 py-2 rounded-[8px] font-[family-name:var(--font-dm-sans)] text-[12px] font-medium border-none cursor-pointer"
              style={{ background: c.terraBg, color: c.terra, opacity: isPending ? 0.7 : 1 }}
            >
              Revoke
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function ShopList({ shops, showActions }: { shops: unknown[]; showActions: boolean }) {
  if (shops.length === 0) {
    return (
      <div className="rounded-[14px] p-8 text-center" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
        <p className="font-[family-name:var(--font-dm-sans)] text-[14px]" style={{ color: c.stone }}>
          No shops to display.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {shops.map(shop => (
        <ShopCard key={(shop as unknown as Shop).id} shop={shop as unknown as Shop} showActions={showActions} />
      ))}
    </div>
  )
}
