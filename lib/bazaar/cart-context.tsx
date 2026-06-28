'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

export interface CartItem {
  productId: string
  variantId?: string
  shopId: string
  shopName: string
  shopSlug: string
  name: string
  price: number
  salePrice: number | null
  unit: string
  imageUrl: string | null
  quantity: number
}

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: string, variantId?: string) => void
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void
  clearCart: () => void
  itemCount: number
  shopCount: number
  subtotal: number
  shopGroups: { shopId: string; shopName: string; shopSlug: string; items: CartItem[] }[]
}

const CartContext = createContext<CartState | null>(null)

const STORAGE_KEY = 'bazaar-cart'

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {}
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setItems(loadCart())
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) saveCart(items)
  }, [items, loaded])

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === item.productId && i.variantId === item.variantId)
      if (existing) {
        return prev.map(i =>
          (i.productId === item.productId && i.variantId === item.variantId)
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }, [])

  const removeItem = useCallback((productId: string, variantId?: string) => {
    setItems(prev => prev.filter(i => !(i.productId === productId && i.variantId === variantId)))
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => !(i.productId === productId && i.variantId === variantId)))
    } else {
      setItems(prev =>
        prev.map(i => (i.productId === productId && i.variantId === variantId) ? { ...i, quantity } : i)
      )
    }
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const shopIds = new Set(items.map(i => i.shopId))
  const shopCount = shopIds.size
  const subtotal = items.reduce((sum, i) => sum + (i.salePrice ?? i.price) * i.quantity, 0)

  const shopGroups = Array.from(shopIds).map(shopId => {
    const shopItems = items.filter(i => i.shopId === shopId)
    return {
      shopId,
      shopName: shopItems[0].shopName,
      shopSlug: shopItems[0].shopSlug,
      items: shopItems,
    }
  })

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount, shopCount, subtotal, shopGroups }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
