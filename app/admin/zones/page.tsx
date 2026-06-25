export const dynamic = 'force-dynamic'
import { getAllZones } from '@/lib/bazaar/zone-actions'
import { ZoneManager } from './zone-manager'

export default async function AdminZonesPage() {
  const zones = await getAllZones()
  return (
    <div>
      <h1 className="font-[family-name:var(--font-dm-sans)] text-[24px] font-medium mb-1" style={{ color: '#1E1C19' }}>
        Delivery zones
      </h1>
      <p className="font-[family-name:var(--font-dm-sans)] text-[14px] mb-6" style={{ color: '#7A756E' }}>
        Set a delivery fee, minimum order, and free-delivery threshold per area. Customers pick their zone when saving an address.
      </p>
      <ZoneManager zones={zones} />
    </div>
  )
}
