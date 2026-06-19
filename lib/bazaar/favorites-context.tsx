'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

export interface FavoriteItem {
  id: string
  type: 'product' | 'shop'
  name: string
  imageUrl: string | null
  shopName?: string
  shopSlug?: string
  price?: number
  slug?: string
}

interface FavoritesState {
  favorites: FavoriteItem[]
  isFavorite: (id: string) => boolean
  toggleFavorite: (item: FavoriteItem) => void
  favoriteCount: number
}

const FavoritesContext = createContext<FavoritesState | null>(null)

const STORAGE_KEY = 'bazaar-favorites'

function loadFavorites(): FavoriteItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveFavorites(items: FavoriteItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {}
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setFavorites(loadFavorites())
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) saveFavorites(favorites)
  }, [favorites, loaded])

  const isFavorite = useCallback((id: string) => {
    return favorites.some(f => f.id === id)
  }, [favorites])

  const toggleFavorite = useCallback((item: FavoriteItem) => {
    setFavorites(prev => {
      const exists = prev.find(f => f.id === item.id)
      if (exists) return prev.filter(f => f.id !== item.id)
      return [...prev, item]
    })
  }, [])

  const favoriteCount = favorites.length

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite, favoriteCount }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider')
  return ctx
}
