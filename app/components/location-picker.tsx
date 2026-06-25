'use client'

import { useEffect, useRef, useState } from 'react'

const c = {
  green:    '#2D8A5E',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
} as const

// Amedi (Amadiya), Duhok Governorate, Kurdistan
const AMEDI: [number, number] = [37.0921, 43.4869]

interface Props {
  lat: number | null
  lng: number | null
  onChange: (lat: number, lng: number) => void
}

// Minimal Leaflet typings — we load the library from CDN at runtime so there's
// no npm dependency and no SSR/bundler hassle.
type LeafletMap = {
  setView: (c: [number, number], z: number) => LeafletMap
  remove: () => void
  on: (ev: string, cb: (e: { latlng: { lat: number; lng: number } }) => void) => void
}
type LeafletMarker = {
  setLatLng: (c: [number, number]) => LeafletMarker
  on: (ev: string, cb: () => void) => void
  getLatLng: () => { lat: number; lng: number }
  addTo: (m: LeafletMap) => LeafletMarker
}
type Leaflet = {
  map: (el: HTMLElement) => LeafletMap
  tileLayer: (url: string, opts: Record<string, unknown>) => { addTo: (m: LeafletMap) => void }
  marker: (c: [number, number], opts: Record<string, unknown>) => LeafletMarker
  icon: (opts: Record<string, unknown>) => unknown
}

declare global {
  interface Window { L?: Leaflet }
}

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'

function loadLeaflet(): Promise<Leaflet> {
  return new Promise((resolve, reject) => {
    if (window.L) return resolve(window.L)

    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = LEAFLET_CSS
      document.head.appendChild(link)
    }

    const existing = document.querySelector(`script[src="${LEAFLET_JS}"]`) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => window.L ? resolve(window.L) : reject(new Error('Leaflet failed')))
      return
    }

    const script = document.createElement('script')
    script.src = LEAFLET_JS
    script.async = true
    script.onload = () => (window.L ? resolve(window.L) : reject(new Error('Leaflet failed')))
    script.onerror = () => reject(new Error('Could not load map'))
    document.head.appendChild(script)
  })
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

        const icon = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41], iconAnchor: [12, 41],
        })

        const marker = L.marker(start, { draggable: true, icon }).addTo(map)
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
