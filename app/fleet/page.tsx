export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { getBazaarUser, bazaarLogout } from '@/lib/bazaar/auth'
import { getFleetDashboard } from '@/lib/bazaar/fleet-actions'
import { LanguageSwitcher } from '@/app/components/language-switcher'
import { FleetBoard } from './fleet-board'

export default async function FleetPage() {
  const user = await getBazaarUser()
  if (!user) redirect('/login')
  if (user.role !== 'fleet_manager') redirect('/')

  const data = user.is_approved && !user.is_suspended ? await getFleetDashboard() : null

  return (
    <div className="min-h-[100dvh] bg-[#FAFAF7] text-[#1E1C19]">
      <header className="sticky top-0 z-10 bg-[#FAFAF7]/90 backdrop-blur border-b border-[#E8E4DE]">
        <div className="max-w-[1000px] mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <span className="text-[18px] font-medium">kela<span className="text-[#2D8A5E]">.</span> <span className="text-[12px] text-[#716C66] font-[family-name:var(--font-dm-mono)]">FLEET</span></span>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <form action={bazaarLogout}>
              <button className="text-[13px] text-[#716C66] bg-transparent border-none cursor-pointer">Sign out</button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-4 py-8">
        {!data ? (
          <div className="max-w-[420px] mx-auto text-center py-16">
            <h1 className="text-[24px] font-medium mb-3">Pending approval</h1>
            <p className="text-[14px] text-[#716C66]">
              Your delivery company is under review. The Kela team will approve it soon, then you can add drivers and assign orders.
            </p>
          </div>
        ) : (
          <FleetBoard {...(data as unknown as Parameters<typeof FleetBoard>[0])} />
        )}
      </main>
    </div>
  )
}
