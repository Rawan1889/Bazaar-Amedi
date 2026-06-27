'use client'

import { useState, useEffect, useRef } from 'react'
import { getMyNotifications, markNotificationRead, markAllNotificationsRead, getUnreadCount } from '@/lib/bazaar/push-notifications'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  terra:    '#C4654A',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
} as const

interface Notification {
  id: string
  type: string
  title: string
  body: string
  data: { url?: string }
  is_read: boolean
  created_at: string
}

const typeIcons: Record<string, string> = {
  new_order: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  order_status: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
  shop_approved: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  welcome: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function NotificationBell({ dropdownSide = 'right' }: { dropdownSide?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getUnreadCount().then(setUnread)
    const interval = setInterval(() => getUnreadCount().then(setUnread), 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getMyNotifications().then(data => {
      setNotifications(data as Notification[])
      setLoading(false)
    })
  }, [open])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleMarkRead(id: string) {
    await markNotificationRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnread(prev => Math.max(0, prev - 1))
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead()
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnread(0)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative w-10 h-10 rounded-[10px] flex items-center justify-center border-none cursor-pointer transition-colors duration-150"
        style={{ background: open ? c.greenBg : 'transparent' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c.charcoal} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-[family-name:var(--font-dm-mono)] text-[10px] font-medium px-1"
            style={{ background: c.terra, color: '#fff' }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute ${dropdownSide === 'left' ? 'left-0' : 'right-0'} top-12 w-[340px] max-h-[420px] rounded-[14px] overflow-hidden shadow-lg z-50 flex flex-col`}
          style={{ background: c.white, border: `1px solid ${c.cream2}` }}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${c.cream}` }}>
            <span className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: c.charcoal }}>
              Notifications
            </span>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="font-[family-name:var(--font-dm-sans)] text-[11px] border-none bg-transparent cursor-pointer"
                style={{ color: c.green }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-6 text-center">
                <span className="font-[family-name:var(--font-dm-mono)] text-[11px]" style={{ color: c.stone }}>Loading...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: c.cream }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c.stone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <span className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.stone }}>
                  No notifications yet
                </span>
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => {
                    if (!n.is_read) handleMarkRead(n.id)
                    if (n.data?.url) window.location.href = n.data.url
                    setOpen(false)
                  }}
                  className="w-full text-left px-4 py-3 border-none cursor-pointer transition-colors duration-100 flex items-start gap-3"
                  style={{
                    background: n.is_read ? 'transparent' : c.greenBg,
                    borderBottom: `1px solid ${c.cream}`,
                  }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: n.is_read ? c.cream : 'rgba(45,138,94,0.12)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={n.is_read ? c.stone : c.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d={typeIcons[n.type] || typeIcons.welcome} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium truncate" style={{ color: c.charcoal }}>
                      {n.title}
                    </div>
                    <div className="font-[family-name:var(--font-dm-sans)] text-[12px] line-clamp-2" style={{ color: c.stone }}>
                      {n.body}
                    </div>
                    <div className="font-[family-name:var(--font-dm-mono)] text-[10px] mt-1" style={{ color: c.stone }}>
                      {timeAgo(n.created_at)}
                    </div>
                  </div>
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2" style={{ background: c.green }} />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
