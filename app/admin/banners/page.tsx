export const dynamic = 'force-dynamic'
import { getAllBanners } from '@/lib/bazaar/banner-actions'
import { BannerManager } from './banner-manager'

export default async function AdminBannersPage() {
  const banners = await getAllBanners()
  return (
    <div>
      <h1 className="font-[family-name:var(--font-dm-sans)] text-[24px] font-medium mb-1" style={{ color: '#1E1C19' }}>
        Promo banner
      </h1>
      <p className="font-[family-name:var(--font-dm-sans)] text-[14px] mb-6" style={{ color: '#7A756E' }}>
        Schedule a popup offer for shoppers. The most recent active banner within its date window is shown; customers can dismiss it.
      </p>
      <BannerManager banners={banners} />
    </div>
  )
}
