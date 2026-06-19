'use client'

import { useFavorites, type FavoriteItem } from '@/lib/bazaar/favorites-context'

const c = {
  terra: '#C4654A',
  stone: '#7A756E',
  cream: '#F2EFEA',
} as const

interface Props {
  item: FavoriteItem
  size?: 'sm' | 'md'
}

export function FavoriteButton({ item, size = 'sm' }: Props) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const active = isFavorite(item.id)
  const s = size === 'sm' ? 14 : 18

  return (
    <button
      onClick={e => { e.preventDefault(); e.stopPropagation(); toggleFavorite(item) }}
      className="flex items-center justify-center border-none cursor-pointer transition-all duration-150 rounded-[6px]"
      style={{
        background: active ? 'rgba(196,101,74,0.08)' : c.cream,
        padding: size === 'sm' ? '4px' : '6px',
      }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <svg width={s} height={s} viewBox="0 0 24 24" fill={active ? c.terra : 'none'} stroke={active ? c.terra : c.stone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    </button>
  )
}
