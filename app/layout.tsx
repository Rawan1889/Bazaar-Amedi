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
import { SITE_URL } from '@/lib/bazaar/site'
import { cookies } from 'next/headers'
import { LOCALE_COOKIE, isBazaarLocale } from '@/lib/bazaar/locale-cookie'
import { isRtl } from '@/lib/bazaar/i18n'
import { DialogProvider } from '@/app/components/dialog-provider'

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'kela. — Shop Every Market in Amedi',
    template: '%s · kela.',
  },
  description:
    'Compare prices across local shops, catch flash sales, and get everything delivered in one trip. The marketplace built for Amedi.',
  openGraph: {
    siteName: 'kela.',
    title: 'kela. — Shop Every Market in Amedi',
    description: 'Compare prices, catch flash sales, one delivery from multiple shops.',
    type: 'website',
    locale: 'en',
    alternateLocale: ['ku', 'ar'],
  },
  twitter: { card: 'summary_large_image' },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'kela.',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value
  const locale = isBazaarLocale(saved) ? saved : 'en'
  return (
    <html lang={locale} dir={isRtl(locale) ? 'rtl' : 'ltr'} className={`${dmSans.variable} ${dmMono.variable}`}>
      <body>
        <LocaleProvider initialLocale={locale}>
          <AutoTranslator />
          <FavoritesProvider>
            <CartProvider>
              <DialogProvider>
                <RealtimeWrapper />
                <PWARegister />
                <AuthNotifications />
                {children}
                <MobileNav />
              </DialogProvider>
            </CartProvider>
          </FavoritesProvider>
        </LocaleProvider>
      </body>
    </html>
  )
}
