export const dynamic = 'force-dynamic'
import { createBazaarServer } from '@/lib/bazaar/supabase-server'
import { getBazaarUser } from '@/lib/bazaar/auth'
import { redirect } from 'next/navigation'
import { ShopSettingsForm } from './settings-form'

export default async function ShopSettingsPage() {
  const user = await getBazaarUser()
  if (!user) redirect('/login')

  const supabase = await createBazaarServer()

  const { data: shop } = await supabase
    .from('bazaar_shops')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  const { data: categories } = await supabase
    .from('bazaar_categories')
    .select('id, name_en')
    .order('sort_order', { ascending: true })

  return (
    <div>
      <h1 className="font-[family-name:var(--font-dm-sans)] text-[28px] font-medium mb-1" style={{ color: '#1E1C19' }}>
        Shop Settings
      </h1>
      <p className="font-[family-name:var(--font-dm-sans)] text-[14px] mb-8" style={{ color: '#7A756E' }}>
        {shop ? 'Update your shop details' : 'Set up your shop to start selling'}
      </p>

      <ShopSettingsForm shop={shop} categories={categories || []} />
    </div>
  )
}
