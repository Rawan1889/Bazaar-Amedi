import { redirect } from 'next/navigation'
import { getBazaarUser } from '@/lib/bazaar/auth'
import { AdminSidebar } from './admin-sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getBazaarUser()

  if (!user) redirect('/login')
  if (user.role !== 'super_admin') redirect('/')

  return (
    <div className="min-h-[100dvh] flex" style={{ background: '#FAFAF7' }}>
      <AdminSidebar user={user} />
      <main className="flex-1 ml-[240px] p-8">
        {children}
      </main>
    </div>
  )
}
