export type BazaarRole = 'customer' | 'market_admin' | 'driver' | 'super_admin'

export interface BazaarProfile {
  id: string
  role: BazaarRole
  full_name: string
  phone: string
  avatar_url: string | null
  neighborhood: string | null
  is_approved: boolean
  is_online: boolean
  created_at: string
}

export interface BazaarCategory {
  id: string
  name_en: string
  name_ku: string | null
  name_ar: string | null
  slug: string
  icon: string | null
  sort_order: number
}

export interface BazaarShop {
  id: string
  owner_id: string
  name: string
  slug: string
  description: string | null
  category_id: string | null
  phone: string | null
  address: string | null
  logo_url: string | null
  cover_url: string | null
  is_open: boolean
  opens_at: string | null
  closes_at: string | null
  is_approved: boolean
  created_at: string
  category?: BazaarCategory
  owner?: BazaarProfile
}

export interface BazaarProduct {
  id: string
  shop_id: string
  category_id: string | null
  name_en: string
  name_ku: string | null
  name_ar: string | null
  description: string | null
  price: number
  image_url: string | null
  unit: string
  in_stock: boolean
  sort_order: number
  created_at: string
  shop?: BazaarShop
  flash_sale?: BazaarFlashSale | null
}

export interface BazaarFlashSale {
  id: string
  product_id: string
  sale_price: number
  starts_at: string
  ends_at: string
  is_active: boolean
}

export type OrderStatus = 'pending' | 'confirmed' | 'picking_up' | 'delivering' | 'delivered' | 'cancelled'
export type PickupStatus = 'pending' | 'picked_up'

export interface BazaarOrder {
  id: string
  order_number: number
  customer_id: string
  driver_id: string | null
  status: OrderStatus
  delivery_address: string
  delivery_fee: number
  total: number
  note: string | null
  created_at: string
  delivered_at: string | null
  items?: BazaarOrderItem[]
  customer?: BazaarProfile
  driver?: BazaarProfile
}

export interface BazaarOrderItem {
  id: string
  order_id: string
  product_id: string
  shop_id: string
  product_name: string
  quantity: number
  unit_price: number
  pickup_status: PickupStatus
  shop?: BazaarShop
}
