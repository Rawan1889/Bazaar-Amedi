export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getBazaarUser } from '@/lib/bazaar/auth'
import { createBazaarServer } from '@/lib/bazaar/supabase-server'
import { OnboardingWizard } from './onboarding-wizard'
import { getActiveZones } from '@/lib/bazaar/zone-actions'

export default async function ShopOnboardingPage() {
  const user = await getBazaarUser()
  if (!user || (user.role !== 'market_admin' && user.role !== 'super_admin')) {
    redirect('/login')
  }

  const supabase = await createBazaarServer()

  const { data: shop } = await supabase
    .from('bazaar_shops')
    .select('*, bazaar_categories(name_en)')
    .eq('owner_id', user.id)
    .single()

  if (shop?.onboarding_completed) {
    redirect('/shop')
  }

  const { data: categories } = await supabase
    .from('bazaar_categories')
    .select('id, name_en')
    .order('sort_order')

  const { data: products } = await supabase
    .from('bazaar_products')
    .select('id, name_en, price, unit, in_stock')
    .eq('shop_id', shop?.id || '')
    .order('created_at', { ascending: false })
    .limit(10)

  const zones = await getActiveZones()

  return (
    <OnboardingWizard
      shop={shop}
      categories={categories || []}
      products={products || []}
      zones={zones}
      currentStep={shop?.onboarding_step || 0}
    />
  )
}
