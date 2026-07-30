import { redirect } from 'next/navigation'
import { getBazaarUser } from '@/lib/bazaar/auth'
import { createBazaarServer } from '@/lib/bazaar/supabase-server'
import { ShopSidebar } from '../sidebar'
import { ShopStorefrontButton } from '@/app/components/shop-storefront-button'

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const user = await getBazaarUser()

  if (!user) redirect('/login')
  if (user.role !== 'market_admin' && user.role !== 'super_admin') redirect('/')

  const supabase = await createBazaarServer()
  const { data: shop } = await supabase
    .from('bazaar_shops')
    .select('onboarding_completed')
    .eq('owner_id', user.id)
    .single()

  if (!shop || !shop.onboarding_completed) redirect('/shop/onboarding')

  return (
    <div className="min-h-[100dvh] flex" style={{ background: '#FAFAF7' }}>
      <ShopSidebar user={user} />
      <main className="flex-1 md:ml-[240px] pt-16 md:pt-8 px-4 md:px-8 pb-24 md:pb-8">
        {children}
      </main>
      <ShopStorefrontButton />
    </div>
  )
}
