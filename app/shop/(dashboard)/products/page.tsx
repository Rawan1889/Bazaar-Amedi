export const dynamic = 'force-dynamic'
import { createBazaarServer } from '@/lib/bazaar/supabase-server'
import { getBazaarUser } from '@/lib/bazaar/auth'
import { redirect } from 'next/navigation'
import { ProductList } from './product-list'
import { AddProductForm } from './add-product-form'

export default async function ProductsPage() {
  const user = await getBazaarUser()
  if (!user) redirect('/login')

  const supabase = await createBazaarServer()

  const { data: shop } = await supabase
    .from('bazaar_shops')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!shop) {
    return (
      <div>
        <h1 className="font-[family-name:var(--font-dm-sans)] text-[28px] font-medium mb-2" style={{ color: '#1E1C19' }}>
          Products
        </h1>
        <p className="font-[family-name:var(--font-dm-sans)] text-[14px] mb-4" style={{ color: '#7A756E' }}>
          You need to set up your shop first before adding products.
        </p>
        <a
          href="/shop/settings"
          className="inline-block px-4 py-2 rounded-[8px] no-underline font-[family-name:var(--font-dm-sans)] text-[13px] font-medium"
          style={{ background: '#2D8A5E', color: '#fff' }}
        >
          Set up shop
        </a>
      </div>
    )
  }

  const { data: products } = await supabase
    .from('bazaar_products')
    .select('*, bazaar_categories(name_en)')
    .eq('shop_id', shop.id)
    .order('sort_order', { ascending: true })

  const { data: categories } = await supabase
    .from('bazaar_categories')
    .select('id, name_en')
    .order('sort_order', { ascending: true })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-[family-name:var(--font-dm-sans)] text-[28px] font-medium mb-1" style={{ color: '#1E1C19' }}>
            Products
          </h1>
          <p className="font-[family-name:var(--font-dm-sans)] text-[14px]" style={{ color: '#7A756E' }}>
            {products?.length ?? 0} products in your catalog
          </p>
        </div>
      </div>

      <AddProductForm categories={categories || []} />
      <ProductList products={products || []} />
    </div>
  )
}
