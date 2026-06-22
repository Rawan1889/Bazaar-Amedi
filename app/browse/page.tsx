export const dynamic = 'force-dynamic'
import { createBazaarServer } from '@/lib/bazaar/supabase-server'
import Link from 'next/link'
import { AddToCartButton } from '@/app/components/add-to-cart-button'
import { CartBar } from '@/app/components/cart-bar'
import { SearchBar } from '@/app/components/search-bar'
import { LocalizedName } from '@/app/components/localized-name'
import { CustomerNav } from '@/app/components/customer-nav'
import { FlashSalesStrip } from '@/app/components/flash-sales-strip'
import { CategoryFilter } from '@/app/components/category-filter'
import { FavoriteButton } from '@/app/components/favorite-button'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  terra:    '#C4654A',
  saffron:  '#E8A838',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  bg:       '#FAFAF7',
  white:    '#FFFFFF',
} as const

function formatIQD(amount: number) {
  return new Intl.NumberFormat('en-IQ').format(amount) + ' IQD'
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const params = await searchParams
  const supabase = await createBazaarServer()

  const { data: categories } = await supabase
    .from('bazaar_categories')
    .select('*')
    .order('sort_order')

  // Active flash sales
  const { data: flashSales } = await supabase
    .from('bazaar_flash_sales')
    .select('*, bazaar_products(id, name_en, name_ku, name_ar, shop_id, unit, price, image_url, bazaar_shops(name, slug)), bazaar_product_variants(amount, unit)')
    .eq('is_active', true)
    .gt('ends_at', new Date().toISOString())
    .order('ends_at', { ascending: true })
    .limit(8)

  // Resolve the category slug to an id so we can filter products by their own
  // category_id. Filtering on a non-inner embedded table (bazaar_categories.slug)
  // does not restrict the parent rows in PostgREST, so the filter must be on the
  // product column directly.
  let categoryId: string | null = null
  if (params.category) {
    const { data: cat } = await supabase
      .from('bazaar_categories')
      .select('id')
      .eq('slug', params.category)
      .single()
    categoryId = cat?.id ?? null
  }

  let productsQuery = supabase
    .from('bazaar_products')
    .select('*, bazaar_shops!inner(name, slug, is_open, is_approved), bazaar_categories(name_en, name_ku, name_ar), bazaar_flash_sales(sale_price, ends_at, is_active)')
    .eq('in_stock', true)
    .eq('bazaar_shops.is_approved', true)
    .order('created_at', { ascending: false })
    .limit(40)

  if (categoryId) {
    productsQuery = productsQuery.eq('category_id', categoryId)
  }

  const { data: products } = await productsQuery

  const activeCategory = params.category || null

  return (
    <div className="min-h-[100dvh]" style={{ background: c.bg }}>
      <CustomerNav />

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <h1 className="font-[family-name:var(--font-dm-sans)] text-[28px] font-medium mb-1" style={{ color: c.charcoal }}>
          Browse Amedi&apos;s Markets
        </h1>
        <p className="font-[family-name:var(--font-dm-sans)] text-[14px] mb-6" style={{ color: c.stone }}>
          Compare prices across shops and find the best deals.
        </p>

        {/* Flash Sales Strip */}
        {flashSales && flashSales.length > 0 && (
          <FlashSalesStrip sales={flashSales as Parameters<typeof FlashSalesStrip>[0]['sales']} />
        )}

        {/* Search + Category filter */}
        <div className="flex gap-3 mb-8 items-center">
          <div className="flex-1">
            <SearchBar />
          </div>
          <CategoryFilter categories={categories ?? []} activeCategory={activeCategory} />
        </div>

        {/* Products grid */}
        {(!products || products.length === 0) ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: c.greenBg }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h2 className="font-[family-name:var(--font-dm-sans)] text-[20px] font-medium mb-1" style={{ color: c.charcoal }}>
              No products yet
            </h2>
            <p className="font-[family-name:var(--font-dm-sans)] text-[14px]" style={{ color: c.stone }}>
              Markets are still setting up. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product: Record<string, unknown>) => {
              const p = product as {
                id: string; shop_id: string; name_en: string; name_ku: string | null; name_ar: string | null; price: number; unit: string; image_url: string | null; description: string | null
                bazaar_shops: { name: string; slug: string }
                bazaar_categories: { name_en: string; name_ku: string | null; name_ar: string | null } | null
                bazaar_flash_sales: { sale_price: number; ends_at: string; is_active: boolean }[] | null
              }
              const activeSale = p.bazaar_flash_sales?.find(s => s.is_active && new Date(s.ends_at) > new Date())

              return (
                <Link
                  key={p.id}
                  href={`/s/${p.bazaar_shops.slug}`}
                  className="rounded-[14px] overflow-hidden no-underline transition-all duration-200 group"
                  style={{ background: c.white, border: `1px solid ${c.cream2}` }}
                >
                  <div className="aspect-square relative" style={{ background: c.cream }}>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name_en} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="font-[family-name:var(--font-dm-sans)] text-[32px] font-medium" style={{ color: c.cream2 }}>
                          {p.name_en.charAt(0)}
                        </span>
                      </div>
                    )}
                    {activeSale && (
                      <div
                        className="absolute top-2 left-2 px-2 py-1 rounded-[6px] font-[family-name:var(--font-dm-mono)] text-[10px] font-medium"
                        style={{ background: c.terra, color: '#fff' }}
                      >
                        SALE
                      </div>
                    )}
                    <div className="absolute top-2 right-2" onClick={e => e.preventDefault()}>
                      <FavoriteButton
                        item={{
                          id: p.id,
                          type: 'product',
                          name: p.name_en,
                          imageUrl: p.image_url,
                          shopName: p.bazaar_shops.name,
                          shopSlug: p.bazaar_shops.slug,
                          price: activeSale?.sale_price ?? p.price,
                        }}
                      />
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium mb-0.5 truncate" style={{ color: c.charcoal }}>
                      <LocalizedName en={p.name_en} ku={p.name_ku} ar={p.name_ar} />
                    </div>
                    <div className="font-[family-name:var(--font-dm-mono)] text-[10px] mb-2 truncate" style={{ color: c.stone }}>
                      {p.bazaar_shops.name}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {activeSale ? (
                          <>
                            <span className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: c.terra }}>
                              {formatIQD(activeSale.sale_price)}
                            </span>
                            <span className="font-[family-name:var(--font-dm-sans)] text-[11px] line-through" style={{ color: c.stone }}>
                              {formatIQD(p.price)}
                            </span>
                          </>
                        ) : (
                          <span className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: c.green }}>
                            {formatIQD(p.price)}
                          </span>
                        )}
                        <span className="font-[family-name:var(--font-dm-mono)] text-[9px]" style={{ color: c.stone }}>
                          /{p.unit}
                        </span>
                      </div>
                      <AddToCartButton
                        productId={p.id}
                        shopId={p.shop_id}
                        shopName={p.bazaar_shops.name}
                        shopSlug={p.bazaar_shops.slug}
                        name={p.name_en}
                        price={p.price}
                        salePrice={activeSale?.sale_price ?? null}
                        unit={p.unit}
                        imageUrl={p.image_url}
                      />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <CartBar />
    </div>
  )
}
