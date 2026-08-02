import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getBazaarUser } from '@/lib/bazaar/auth'
import { getSupportThread } from '@/lib/bazaar/support-actions'
import { ThreadView } from '../thread-view'

const c = {
  green:    '#2D8A5E',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
} as const

export default async function SupportThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getBazaarUser()
  if (!user) redirect(`/login?redirect=/support/${id}`)

  const data = await getSupportThread(id)
  if (!data) notFound()

  return (
    <div className="min-h-[100dvh] px-4 md:px-8 py-6 pb-24 md:pb-8" style={{ background: '#FAFAF7' }}>
      <div className="max-w-[720px] mx-auto">
        <Link href="/support" className="font-[family-name:var(--font-dm-mono)] text-[11px] no-underline" style={{ color: c.stone }}>
          ← Back to tickets
        </Link>
        <div className="mt-4 rounded-[14px] p-5" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
          <ThreadView
            thread={data.thread}
            initialMessages={data.messages}
            currentUserId={user.id}
            viewerIsAdmin={user.role === 'super_admin'}
          />
        </div>
      </div>
    </div>
  )
}
