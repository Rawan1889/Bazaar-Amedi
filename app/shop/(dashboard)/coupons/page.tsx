export const dynamic = 'force-dynamic'
import { getShopCoupons } from '@/lib/bazaar/coupon-actions'
import { CouponManager } from './coupon-manager'

export default async function CouponsPage() {
  const coupons = await getShopCoupons()

  return <CouponManager coupons={coupons} />
}
