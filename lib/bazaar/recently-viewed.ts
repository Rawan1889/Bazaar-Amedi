// localStorage-backed "recently viewed" products. Browser-only.

export interface ViewedProduct {
  id: string
  name_en: string
  image_url: string | null
  price: number
  unit: string
  shopId: string
  shopName: string
  shopSlug: string
}

const KEY = 'bazaar-recently-viewed'
const MAX = 10

export function recordView(p: ViewedProduct) {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(KEY)
    const list: ViewedProduct[] = raw ? JSON.parse(raw) : []
    const next = [p, ...list.filter(x => x.id !== p.id)].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch { /* ignore */ }
}

export function getRecentlyViewed(): ViewedProduct[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function keepOnlyIds(existingIds: string[]) {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return
    const list: ViewedProduct[] = JSON.parse(raw)
    const set = new Set(existingIds)
    localStorage.setItem(KEY, JSON.stringify(list.filter(p => set.has(p.id))))
  } catch { /* ignore */ }
}
