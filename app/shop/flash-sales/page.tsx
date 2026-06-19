export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { getBazaarUser } from '@/lib/bazaar/auth'
import { getShopFlashSales, getShopProducts } from '@/lib/bazaar/flash-sale-actions'
import { FlashSaleManager } from './flash-sale-manager'

export default async function FlashSalesPage() {
  const user = await getBazaarUser()
  if (!user) redirect('/login')

  const [sales, products] = await Promise.all([
    getShopFlashSales(),
    getShopProducts(),
  ])

  return (
    <div>
      <h1 className="font-[family-name:var(--font-dm-sans)] text-[28px] font-medium mb-1" style={{ color: '#1E1C19' }}>
        Flash Sales
      </h1>
      <p className="font-[family-name:var(--font-dm-sans)] text-[14px] mb-8" style={{ color: '#7A756E' }}>
        Create time-limited deals to attract customers.
      </p>

      <FlashSaleManager sales={sales} products={products} />
    </div>
  )
}
