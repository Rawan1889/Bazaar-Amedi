import type { Metadata, Viewport } from 'next'
import { DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/lib/bazaar/cart-context'
import { LocaleProvider } from '@/lib/bazaar/locale-context'
import { FavoritesProvider } from '@/lib/bazaar/favorites-context'
import { RealtimeWrapper } from '@/app/components/realtime-wrapper'
import { MobileNav } from '@/app/components/mobile-nav'
import { PWARegister } from '@/app/components/pwa-register'
import { AuthNotifications } from '@/app/components/auth-notifications'
import { AutoTranslator } from '@/app/components/auto-translator'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'bazaar. — Shop Every Market in Amedi',
  description:
    'Compare prices across local shops, catch flash sales, and get everything delivered in one trip. The marketplace built for Amedi.',
  openGraph: {
    title: 'bazaar. — Shop Every Market in Amedi',
    description: 'Compare prices, catch flash sales, one delivery from multiple shops.',
    type: 'website',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'bazaar.',
  },
  icons: {
    icon: '/icon-192.svg',
    apple: '/icon-192.svg',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
  },
}

// Explicit viewport so Safari renders at the device width instead of the
// default 980px desktop scale (which is what makes the dashboard look zoomed
// in on iPhone). `viewportFit: 'cover'` lets us paint under the notch/home
// bar; we already handle safe-area-inset in the mobile nav.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  viewportFit: 'cover',
  themeColor: '#2D8A5E',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body>
        <LocaleProvider>
          <AutoTranslator />
          <FavoritesProvider>
            <CartProvider>
              <RealtimeWrapper />
              <PWARegister />
              <AuthNotifications />
              {children}
              <MobileNav />
            </CartProvider>
          </FavoritesProvider>
        </LocaleProvider>
      </body>
    </html>
  )
}
