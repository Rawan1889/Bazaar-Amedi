'use client'

import { useState, useEffect } from 'react'
import { saveSubscription, removeSubscription } from '@/lib/bazaar/push-notifications'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  greenBord:'rgba(45,138,94,0.2)',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
} as const

export function PushPrompt({ userId }: { userId: string }) {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [dismissed, setDismissed] = useState(false)
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    if (!('Notification' in window) || !('PushManager' in window)) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission)

    const dismissedAt = localStorage.getItem(`bazaar_push_dismissed_${userId}`)
    if (dismissedAt) {
      const daysSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24)
      if (daysSince < 7) setDismissed(true)
    }
  }, [userId])

  if (permission === 'granted' || permission === 'denied' || permission === 'unsupported' || dismissed) {
    return null
  }

  async function handleEnable() {
    setSubscribing(true)
    try {
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result === 'granted') {
        const reg = await navigator.serviceWorker.ready
        const res = await fetch('/api/push/vapid')
        const { publicKey } = await res.json()

        if (!publicKey) return

        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        })

        const sub = subscription.toJSON()
        await saveSubscription({
          endpoint: sub.endpoint!,
          keys: { p256dh: sub.keys!.p256dh!, auth: sub.keys!.auth! },
        })
      }
    } catch (err) {
      console.error('Push subscription failed:', err)
    } finally {
      setSubscribing(false)
    }
  }

  function handleDismiss() {
    localStorage.setItem(`bazaar_push_dismissed_${userId}`, Date.now().toString())
    setDismissed(true)
  }

  return (
    <div
      className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:max-w-[360px] rounded-[14px] p-5 z-40 shadow-lg"
      style={{ background: c.white, border: `1px solid ${c.cream2}` }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: c.greenBg }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium mb-0.5" style={{ color: c.charcoal }}>
            Stay in the loop
          </div>
          <div className="font-[family-name:var(--font-dm-sans)] text-[12px] mb-3" style={{ color: c.stone }}>
            Get notified about order updates, flash sales, and delivery status.
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleEnable}
              disabled={subscribing}
              className="px-4 py-2 rounded-[8px] font-[family-name:var(--font-dm-sans)] text-[12px] font-medium border-none cursor-pointer transition-transform duration-150 active:scale-[0.96]"
              style={{ background: c.green, color: '#fff', opacity: subscribing ? 0.7 : 1 }}
            >
              {subscribing ? 'Enabling...' : 'Enable'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 rounded-[8px] font-[family-name:var(--font-dm-sans)] text-[12px] font-medium border-none cursor-pointer"
              style={{ background: 'transparent', color: c.stone }}
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
