'use client'

import { useEffect, useRef, useState } from 'react'
import { AMEDI, loadLeaflet, pinIcon, type LeafletMap, type LeafletMarker } from '@/lib/bazaar/leaflet'

const c = {
  green:    '#2D8A5E',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
} as const

interface Props {
  lat: number | null
  lng: number | null
  onChange: (lat: number, lng: number) => void
}

export function LocationPicker({ lat, lng, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markerRef = useRef<LeafletMarker | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    let cancelled = false
    const start: [number, number] = lat != null && lng != null ? [lat, lng] : AMEDI

    loadLeaflet()
      .then(L => {
        if (cancelled || !containerRef.current) return
        const map = L.map(containerRef.current).setView(start, 15)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
          maxZoom: 19,
        }).addTo(map)

        const marker = L.marker(start, { draggable: true, icon: pinIcon(L) }).addTo(map)
        marker.on('dragend', () => {
          const p = marker.getLatLng()
          onChange(p.lat, p.lng)
        })
        map.on('click', (e) => {
          marker.setLatLng([e.latlng.lat, e.latlng.lng])
          onChange(e.latlng.lat, e.latlng.lng)
        })

        mapRef.current = map
        markerRef.current = marker
        setLoading(false)
        // Seed a value if none chosen yet so the pin location is captured.
        if (lat == null || lng == null) onChange(start[0], start[1])
      })
      .catch(() => { if (!cancelled) { setError('Map could not load. You can still type your address below.'); setLoading(false) } })

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function useMyLocation() {
    if (!('geolocation' in navigator)) { setError('Location is not available on this device.'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords
        mapRef.current?.setView([latitude, longitude], 16)
        markerRef.current?.setLatLng([latitude, longitude])
        onChange(latitude, longitude)
        setLocating(false)
      },
      () => { setError('Could not get your location. Drop the pin manually.'); setLocating(false) },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div>
      <div className="relative rounded-[12px] overflow-hidden" style={{ border: `1px solid ${c.cream2}` }}>
        <div ref={containerRef} style={{ height: 240, width: '100%', background: c.cream }} />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: c.cream }}>
            <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: c.cream2, borderTopColor: c.green }} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-2">
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border-none cursor-pointer transition-colors"
          style={{ background: c.cream, color: c.green }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
          <span className="font-[family-name:var(--font-dm-sans)] text-[12px]">
            {locating ? 'Locating…' : 'Use my location'}
          </span>
        </button>
        <span className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>
          {lat != null && lng != null ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'Tap the map to drop a pin'}
        </span>
      </div>

      {error && (
        <p className="font-[family-name:var(--font-dm-sans)] text-[12px] mt-1.5" style={{ color: '#C94A3A' }}>
          {error}
        </p>
      )}
    </div>
  )
}
