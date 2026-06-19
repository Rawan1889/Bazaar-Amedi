import { createBazaarServer } from '@/lib/bazaar/supabase-server'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createBazaarServer()

  const { data: shop } = await supabase
    .from('bazaar_shops')
    .select('name, description, logo_url, bazaar_categories(name_en)')
    .eq('slug', slug)
    .single()

  if (!shop) {
    return { title: 'Shop not found — bazaar.' }
  }

  const category = (shop.bazaar_categories as unknown as { name_en: string } | null)?.name_en
  const description = shop.description || `Browse products from ${shop.name} in Amedi. ${category ? `Category: ${category}.` : ''} Compare prices and order for delivery.`

  return {
    title: `${shop.name} — bazaar.`,
    description,
    openGraph: {
      title: `${shop.name} — bazaar.`,
      description,
      type: 'website',
      ...(shop.logo_url ? { images: [{ url: shop.logo_url }] } : {}),
    },
  }
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children
}
