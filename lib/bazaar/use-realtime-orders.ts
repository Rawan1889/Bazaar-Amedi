'use client'

import { useEffect, useState, useCallback } from 'react'
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

    let filter: string | undefined
    if (role === 'customer') {
      filter = `customer_id=eq.${userId}`
    } else if (role === 'driver') {
      filter = `driver_id=eq.${userId}`
    }

    const channel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bazaar_orders',
          ...(filter ? { filter } : {}),
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
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bazaar_orders',
          ...(filter ? { filter } : {}),
        },
        (payload) => {
          const update: OrderUpdate = {
            id: payload.new.id as string,
            order_number: payload.new.order_number as number,
            status: 'new',
            updated_at: new Date().toISOString(),
          }
          setLatestUpdate(update)
          setNotifications(prev => [update, ...prev].slice(0, 10))
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
