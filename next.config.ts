import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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
}

export default nextConfig
