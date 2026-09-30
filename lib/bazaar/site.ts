export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://bazaar-amedi.vercel.app').replace(/\/$/, '')

export const SITE_NAME = 'kela.'

// A page that sets its own `openGraph` replaces the root one entirely, so it
// must pass this explicitly when it has no photo of its own.
export const DEFAULT_OG_IMAGE = { url: '/opengraph-image', width: 1200, height: 630, alt: 'kela. — Shop every market in Amedi' }
