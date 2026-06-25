// Shared Leaflet loader — loads the library from CDN at runtime so there's no
// npm dependency and no SSR/bundler hassle. Used by the location picker and the
// live order-tracking map. Browser-only (touches document/window).

// Amedi (Amadiya), Duhok Governorate, Kurdistan
export const AMEDI: [number, number] = [37.0921, 43.4869]

export type LeafletLatLng = { lat: number; lng: number }
export type LeafletMap = {
  setView: (c: [number, number], z: number) => LeafletMap
  fitBounds: (b: [number, number][], opts?: Record<string, unknown>) => void
  remove: () => void
  on: (ev: string, cb: (e: { latlng: LeafletLatLng }) => void) => void
  invalidateSize: () => void
}
export type LeafletMarker = {
  setLatLng: (c: [number, number]) => LeafletMarker
  on: (ev: string, cb: () => void) => void
  getLatLng: () => LeafletLatLng
  addTo: (m: LeafletMap) => LeafletMarker
  remove: () => void
}
export type Leaflet = {
  map: (el: HTMLElement, opts?: Record<string, unknown>) => LeafletMap
  tileLayer: (url: string, opts: Record<string, unknown>) => { addTo: (m: LeafletMap) => void }
  marker: (c: [number, number], opts?: Record<string, unknown>) => LeafletMarker
  icon: (opts: Record<string, unknown>) => unknown
  divIcon: (opts: Record<string, unknown>) => unknown
}

declare global {
  interface Window { L?: Leaflet }
}

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'

export function loadLeaflet(): Promise<Leaflet> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Not in browser'))
    if (window.L) return resolve(window.L)

    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = LEAFLET_CSS
      document.head.appendChild(link)
    }

    const existing = document.querySelector(`script[src="${LEAFLET_JS}"]`) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => (window.L ? resolve(window.L) : reject(new Error('Leaflet failed'))))
      if (window.L) resolve(window.L)
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

// Standard pin icon (used for draggable / destination markers).
export function pinIcon(L: Leaflet) {
  return L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41],
  })
}

// Colored dot icon (used for the live driver marker).
export function dotIcon(L: Leaflet, color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 0 0 2px ${color}55"></div>`,
    iconSize: [18, 18], iconAnchor: [9, 9],
  })
}
