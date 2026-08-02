import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getBazaarUser } from '@/lib/bazaar/auth'
import { getSupportThread } from '@/lib/bazaar/support-actions'
import { ThreadView } from '@/app/support/thread-view'

const c = {
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
} as const

export default async function AdminSupportThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getBazaarUser()
  if (!user) redirect('/login')
  if (user.role !== 'super_admin') redirect('/')

  const data = await getSupportThread(id)
  if (!data) notFound()

  return (
    <div>
      <Link href="/admin/support" className="font-[family-name:var(--font-dm-mono)] text-[11px] no-underline" style={{ color: c.stone }}>
        ← Back to inbox
      </Link>
      <div className="mt-4 rounded-[14px] p-5 max-w-[800px]" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
        <ThreadView
          thread={data.thread}
          initialMessages={data.messages}
          currentUserId={user.id}
          viewerIsAdmin
        />
      </div>
    </div>
  )
}
