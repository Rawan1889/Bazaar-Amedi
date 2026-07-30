'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBazaarClient } from '@/lib/bazaar/supabase-client'

const c = {
  green:    '#2D8A5E',
  white:    '#FFFFFF',
} as const

// Mobile-only floating pill on shop dashboard pages that jumps to the
// public storefront view (customer-facing product grid, but scoped to
// this shop). Desktop shop sidebar already has links; this saves the
// hamburger dance on phones.
export function ShopStorefrontButton() {
  const [slug, setSlug] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createBazaarClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return
      const { data: shop } = await supabase
        .from('bazaar_shops')
        .select('slug')
        .eq('owner_id', data.session.user.id)
        .single()
      if (shop?.slug) setSlug(shop.slug)
    })
  }, [])

  if (!slug) return null

  return (
    <Link
      href={`/s/${slug}`}
      className="md:hidden fixed left-1/2 bottom-6 -translate-x-1/2 z-30 flex items-center gap-2 px-5 py-3 rounded-full no-underline shadow-lg"
      style={{ background: c.green, color: c.white }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      <span className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium">
        View my storefront
      </span>
    </Link>
  )
}
