import type { NextConfig } from 'next'

// Only directives that can't break maps, images, auth or realtime. A full
// script-src/connect-src policy needs per-request nonces to be worth having.
const securityHeaders = [
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), payment=(), usb=(), geolocation=(self)' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Put <title>/<meta>/Open Graph in <head> for every client, not just the
  // bots on Next's built-in list — Viber and Telegram (big in Kurdistan)
  // aren't on it, so their link previews could miss titles and images.
  htmlLimitedBots: /.*/,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
    // Few formats/sizes and a long cache keep the number of distinct
    // optimizations low. Safe to cache long: uploads use unique timestamped paths.
    formats: ['image/webp'],
    deviceSizes: [640, 828, 1080, 1200],
    imageSizes: [64, 96, 128, 256, 384],
    minimumCacheTTL: 2678400,
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
