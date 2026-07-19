'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getRecentlyViewed, keepOnlyIds, type ViewedProduct } from '@/lib/bazaar/recently-viewed'
import { existingProductIds } from '@/lib/bazaar/search-actions'

const c = {
  green:    '#2D8A5E',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
} as const

function formatIQD(amount: number) {
  return new Intl.NumberFormat('en-IQ').format(amount) + ' IQD'
}

export function RecentlyViewed() {
  const [items, setItems] = useState<ViewedProduct[]>([])

  useEffect(() => {
    const cached = getRecentlyViewed()
    if (cached.length === 0) return
    existingProductIds(cached.map(p => p.id)).then(alive => {
      const set = new Set(alive)
      const kept = cached.filter(p => set.has(p.id))
      keepOnlyIds(alive)
      setItems(kept)
    })
  }, [])

  if (items.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="font-[family-name:var(--font-dm-sans)] text-[15px] font-medium mb-3" style={{ color: c.charcoal }}>
        Recently viewed
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {items.map(p => (
          <Link
            key={p.id}
            href={`/p/${p.id}`}
            className="flex-shrink-0 w-[130px] rounded-[12px] overflow-hidden no-underline"
            style={{ background: c.white, border: `1px solid ${c.cream2}` }}
          >
            <div className="aspect-square" style={{ background: c.cream }}>
              {p.image_url ? (
                <img src={p.image_url} alt={p.name_en} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-[family-name:var(--font-dm-sans)] text-[28px] font-medium" style={{ color: c.cream2 }}>
                    {p.name_en.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div className="p-2">
              <div className="font-[family-name:var(--font-dm-sans)] text-[12px] font-medium truncate" style={{ color: c.charcoal }}>
                {p.name_en}
              </div>
              <div className="font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ color: c.green }}>
                {formatIQD(p.price)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
