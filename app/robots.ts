import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/bazaar/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // '/shop$' + '/shop/' rather than '/shop', which would prefix-match the public /shops page.
      disallow: ['/admin', '/shop$', '/shop/', '/driver', '/api', '/cart', '/orders', '/profile', '/favorites', '/support', '/login', '/signup'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
