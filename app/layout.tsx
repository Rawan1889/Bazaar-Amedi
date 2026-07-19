import type { Metadata } from 'next'
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
    'theme-color': '#2D8A5E',
    'apple-mobile-web-app-capable': 'yes',
  },
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
