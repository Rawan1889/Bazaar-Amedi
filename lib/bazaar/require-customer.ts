import { redirect } from 'next/navigation'
import { getBazaarUser } from './auth'

// Route non-customer roles away from customer-facing pages so shop owners,
// drivers, and admins land in their own dashboard instead. Signed-out users
// pass through — the page decides whether to prompt login.
export async function redirectNonCustomers() {
  const user = await getBazaarUser()
  if (!user) return
  if (user.role === 'market_admin') redirect('/shop')
  if (user.role === 'driver') redirect('/driver')
  if (user.role === 'super_admin') redirect('/admin')
}
