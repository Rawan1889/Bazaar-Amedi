'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBazaarClient } from './supabase-client'

interface OrderUpdate {
  id: string
  order_number: number
  status: string
  updated_at: string
}

export function useRealtimeOrders(userId: string | null, role: string | null) {
  const [latestUpdate, setLatestUpdate] = useState<OrderUpdate | null>(null)
  const [notifications, setNotifications] = useState<OrderUpdate[]>([])

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const dismissAll = useCallback(() => {
    setNotifications([])
  }, [])

  useEffect(() => {
    if (!userId || !role) return

    const supabase = createBazaarClient()

    // Filter for user-specific updates (customer sees their orders,
    // driver sees orders they've been assigned to).
    let updateFilter: string | undefined
    if (role === 'customer') {
      updateFilter = `customer_id=eq.${userId}`
    } else if (role === 'driver') {
      updateFilter = `driver_id=eq.${userId}`
    }

    const channel = supabase
      .channel('order-updates')
      // UPDATE: filtered to user's own orders (customer) or assigned orders (driver)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bazaar_orders',
          ...(updateFilter ? { filter: updateFilter } : {}),
        },
        (payload) => {
          const update: OrderUpdate = {
            id: payload.new.id as string,
            order_number: payload.new.order_number as number,
            status: payload.new.status as string,
            updated_at: new Date().toISOString(),
          }
          setLatestUpdate(update)
          setNotifications(prev => [update, ...prev].slice(0, 10))
        }
      )
      // INSERT: drivers and shop owners need to see brand-new orders (no filter,
      // since new orders have driver_id = null and no shop-specific field here).
      // Customers only see inserts on their own customer_id.
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bazaar_orders',
          ...(role === 'customer' ? { filter: `customer_id=eq.${userId}` } : {}),
        },
        (payload) => {
          // Customers: show a confirmation notification.
          // Drivers and shop owners: trigger a page refresh (handled by latestUpdate
          // watcher in OrderNotifications), but only show a notification if it's
          // relevant (shop = has items for their shop, driver = always show).
          if (role === 'customer' || role === 'driver' || role === 'market_admin') {
            const update: OrderUpdate = {
              id: payload.new.id as string,
              order_number: payload.new.order_number as number,
              status: 'new',
              updated_at: new Date().toISOString(),
            }
            setLatestUpdate(update)
            // Only push a visible notification for drivers and customers.
            // Shop owners get their notification from ShopOrdersRefresher instead.
            if (role !== 'market_admin') {
              setNotifications(prev => [update, ...prev].slice(0, 10))
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, role])

  return { latestUpdate, notifications, dismiss, dismissAll }
}

export function useRealtimeShopOrders(shopId: string | null) {
  const [newOrderCount, setNewOrderCount] = useState(0)
  const [latestOrder, setLatestOrder] = useState<{ id: string; order_number: number } | null>(null)

  const reset = useCallback(() => {
    setNewOrderCount(0)
    setLatestOrder(null)
  }, [])

  useEffect(() => {
    if (!shopId) return

    const supabase = createBazaarClient()

    const channel = supabase
      .channel('shop-order-items')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bazaar_order_items',
          filter: `shop_id=eq.${shopId}`,
        },
        () => {
          setNewOrderCount(prev => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [shopId])

  return { newOrderCount, latestOrder, reset }
}

// Subscribes to unassigned delivery orders (status: confirmed | ready,
// driver_id: null) and triggers a full page refresh whenever one appears
// or changes. Only active when the driver is online — saves subscriptions
// for off-duty drivers.
export function useRealtimeAvailableOrders(isOnline: boolean) {
  const router = useRouter()

  useEffect(() => {
    if (!isOnline) return

    const supabase = createBazaarClient()

    const channel = supabase
      .channel('available-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bazaar_orders',
        },
        () => {
          // A new order was placed — refresh so it appears in the driver panel.
          router.refresh()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bazaar_orders',
        },
        (payload) => {
          // An order just became ready (shop finished packing) or was claimed
          // by another driver — refresh so the list stays accurate.
          const { status, driver_id } = payload.new as { status: string; driver_id: string | null }
          if (['confirmed', 'ready'].includes(status) && driver_id === null) {
            router.refresh()
          } else if (driver_id !== null) {
            // Order was claimed — refresh so it disappears from the available list.
            router.refresh()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isOnline, router])
}
