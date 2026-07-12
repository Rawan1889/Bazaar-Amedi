'use client'

import { useEffect } from 'react'
import { useRealtimeOrders } from '@/lib/bazaar/use-realtime-orders'
import { useRouter } from 'next/navigation'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  white:    '#FFFFFF',
} as const

const statusMessages: Record<string, string> = {
  new:         'New order placed',
  pending:     'Order is pending',
  confirmed:   'Shop confirmed your order',
  ready:       'Order ready for pickup',
  picking_up:  'Driver is picking up your items',
  delivering:  'Your order is on its way',
  delivered:   'Order delivered',
  cancelled:   'Order was cancelled',
}

export function OrderNotifications({ userId, role }: { userId: string; role: string }) {
  const { notifications, dismiss, latestUpdate } = useRealtimeOrders(userId, role)
  const router = useRouter()

  // Auto-refresh the current page whenever an order status changes so
  // Server Components (order list, order detail, driver dashboard) reflect
  // the new status without a manual reload.
  useEffect(() => {
    if (latestUpdate) router.refresh()
  }, [latestUpdate, router])

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-[340px]">
      {notifications.slice(0, 3).map(n => (
        <div
          key={`${n.id}-${n.updated_at}`}
          className="rounded-[12px] p-4 shadow-lg cursor-pointer"
          style={{ background: c.white, border: `1px solid ${c.greenBg}` }}
          onClick={() => {
            dismiss(n.id)
            if (role === 'customer') router.push('/orders')
            else if (role === 'driver') router.push('/driver')
            else router.push('/shop/orders')
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: c.greenBg }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <div className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ color: c.charcoal }}>
                  Order #{n.order_number}
                </div>
                <div className="font-[family-name:var(--font-dm-sans)] text-[11px]" style={{ color: c.stone }}>
                  {statusMessages[n.status] || n.status.replace('_', ' ')}
                </div>
              </div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); dismiss(n.id) }}
              className="p-1 border-none bg-transparent cursor-pointer"
              style={{ color: c.stone }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
