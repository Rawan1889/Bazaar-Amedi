'use client'

import { useEffect, useRef, useState } from 'react'
import { updateDriverLocation } from '@/lib/bazaar/order-actions'

const c = {
  green:   '#2D8A5E',
  greenBg: 'rgba(45,138,94,0.08)',
  stone:   '#7A756E',
  amber:   '#E8A838',
  amberBg: 'rgba(232,168,56,0.1)',
} as const

const THROTTLE_MS = 15000 // push at most once every 15s

// Mounted on the driver dashboard only when the driver has active deliveries.
// Streams the driver's GPS to their active orders so customers can track them.
export function DriverLocationBroadcaster({ active }: { active: boolean }) {
  const [sharing, setSharing] = useState(false)
  const [denied, setDenied] = useState(false)
  const lastSent = useRef(0)
  const watchId = useRef<number | null>(null)

  useEffect(() => {
    if (!active || !('geolocation' in navigator)) return

    watchId.current = navigator.geolocation.watchPosition(
      pos => {
        setSharing(true)
        setDenied(false)
        const now = Date.now()
        if (now - lastSent.current < THROTTLE_MS) return
        lastSent.current = now
        updateDriverLocation(pos.coords.latitude, pos.coords.longitude)
      },
      () => { setDenied(true); setSharing(false) },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    )

    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current)
    }
  }, [active])

  if (!active) return null

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-[10px] mb-4"
      style={{ background: denied ? c.amberBg : c.greenBg }}
    >
      <span className="relative flex h-2 w-2">
        {sharing && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: c.green }} />}
        <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: denied ? c.amber : c.green }} />
      </span>
      <span className="font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ color: denied ? c.amber : c.green }}>
        {denied
          ? 'Location off — turn on GPS so customers can track you'
          : sharing ? 'Sharing your location with customers' : 'Starting location sharing…'}
      </span>
    </div>
  )
}
