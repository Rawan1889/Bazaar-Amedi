'use client'

import { FavoriteButton } from '@/app/components/favorite-button'

interface Props {
  shopId: string
  shopName: string
  shopSlug: string
  logoUrl: string | null
}

export function ShopFavoriteButton({ shopId, shopName, shopSlug, logoUrl }: Props) {
  return (
    <FavoriteButton
      size="md"
      item={{
        id: shopId,
        type: 'shop',
        name: shopName,
        imageUrl: logoUrl,
        slug: shopSlug,
      }}
    />
  )
}
