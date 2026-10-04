import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { SITE_URL } from '@/lib/bazaar/site'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/browse`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/shops`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
  ]

  const url = process.env.NEXT_PUBLIC_BAZAAR_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_BAZAAR_SUPABASE_ANON_KEY
  if (!url || !key) return entries

  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const [{ data: shops }, { data: products }] = await Promise.all([
    supabase.from('bazaar_shops').select('id, slug, created_at').eq('is_approved', true),
    supabase
      .from('bazaar_products')
      .select('id, created_at, bazaar_shops!inner(is_approved)')
      .eq('bazaar_shops.is_approved', true)
      .limit(5000),
  ])

  for (const s of shops ?? []) {
    entries.push({ url: `${SITE_URL}/s/${s.slug}`, lastModified: s.created_at, changeFrequency: 'daily', priority: 0.7 })
  }
  for (const p of products ?? []) {
    entries.push({ url: `${SITE_URL}/p/${p.id}`, lastModified: p.created_at, changeFrequency: 'weekly', priority: 0.6 })
  }
  return entries
}
