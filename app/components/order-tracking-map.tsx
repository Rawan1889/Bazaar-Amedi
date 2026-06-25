'use client'

import { useEffect, useRef, useState } from 'react'
import { createBazaarClient } from '@/lib/bazaar/supabase-client'
import { AMEDI, loadLeaflet, pinIcon, dotIcon, type LeafletMap, type LeafletMarker } from '@/lib/bazaar/leaflet'

const c = {
  green:    '#2D8A5E',
  terra:    '#C4654A',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
} as const

interface Props {
  orderId: string
  destLat: number | null
  destLng: number | null
  driverLat: number | null
  driverLng: number | null
}

export function OrderTrackingMap({ orderId, destLat, destLng, driverLat, driverLng }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const driverMarkerRef = useRef<LeafletMarker | null>(null)
  const leafletRef = useRef<Awaited<ReturnType<typeof loadLeaflet>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [driver, setDriver] = useState<{ lat: number; lng: number } | null>(
    driverLat != null && driverLng != null ? { lat: driverLat, lng: driverLng } : null
  )
  const [updatedAt, setUpdatedAt] = useState<Date | null>(driver ? new Date() : null)

  // Build the map once.
  useEffect(() => {
    let cancelled = false
    const dest: [number, number] | null = destLat != null && destLng != null ? [destLat, destLng] : null
    const center = dest || (driver ? [driver.lat, driver.lng] : AMEDI)

    loadLeaflet()
      .then(L => {
        if (cancelled || !containerRef.current) return
        leafletRef.current = L
        const map = L.map(containerRef.current, { zoomControl: true }).setView(center as [number, number], 15)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap', maxZoom: 19,
        }).addTo(map)

        if (dest) L.marker(dest, { icon: pinIcon(L) }).addTo(map)
        if (driver) {
          driverMarkerRef.current = L.marker([driver.lat, driver.lng], { icon: dotIcon(L, c.green) }).addTo(map)
        }
        if (dest && driver) {
          map.fitBounds([dest, [driver.lat, driver.lng]], { padding: [40, 40] })
        }
        mapRef.current = map
        setTimeout(() => map.invalidateSize(), 100)
        setLoading(false)
      })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false) } })

    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Subscribe to realtime driver-location updates on this order.
  useEffect(() => {
    const supabase = createBazaarClient()
    const channel = supabase
      .channel(`order-track-${orderId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bazaar_orders', filter: `id=eq.${orderId}` },
        (payload: { new: { driver_lat: number | null; driver_lng: number | null } }) => {
          const { driver_lat, driver_lng } = payload.new
          if (driver_lat != null && driver_lng != null) {
            setDriver({ lat: driver_lat, lng: driver_lng })
            setUpdatedAt(new Date())
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [orderId])

  // Move / create the driver marker when its position changes.
  useEffect(() => {
    const L = leafletRef.current
    const map = mapRef.current
    if (!L || !map || !driver) return
    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng([driver.lat, driver.lng])
    } else {
      driverMarkerRef.current = L.marker([driver.lat, driver.lng], { icon: dotIcon(L, c.green) }).addTo(map)
    }
  }, [driver])

  if (error) return null

  return (
    <div>
      <div className="relative rounded-[14px] overflow-hidden" style={{ border: `1px solid ${c.cream2}` }}>
        <div ref={containerRef} style={{ height: 260, width: '100%', background: c.cream }} />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: c.cream }}>
            <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: c.cream2, borderTopColor: c.green }} />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-[family-name:var(--font-dm-sans)] text-[11px]" style={{ color: c.stone }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.green }} /> Driver
          </span>
          <span className="flex items-center gap-1.5 font-[family-name:var(--font-dm-sans)] text-[11px]" style={{ color: c.stone }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.terra }} /> Destination
          </span>
        </div>
        {updatedAt ? (
          <span className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>
            Updated {updatedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </span>
        ) : (
          <span className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>
            Waiting for driver location…
          </span>
        )}
      </div>
    </div>
  )
}
