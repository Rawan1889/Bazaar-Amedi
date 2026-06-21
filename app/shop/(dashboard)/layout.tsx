import { redirect } from 'next/navigation'
import { getBazaarUser } from '@/lib/bazaar/auth'
import { createBazaarServer } from '@/lib/bazaar/supabase-server'
import { ShopSidebar } from '../sidebar'

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
      <main className="flex-1 ml-[240px] p-8">
        {children}
      </main>
    </div>
  )
}
