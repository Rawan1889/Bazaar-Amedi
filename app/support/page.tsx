import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getBazaarUser } from '@/lib/bazaar/auth'
import { getMySupportThreads } from '@/lib/bazaar/support-actions'
import { NewThreadForm } from './new-thread-form'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
} as const

export default async function SupportPage() {
  const user = await getBazaarUser()
  if (!user) redirect('/login?redirect=/support')
  if (user.role === 'super_admin') redirect('/admin/support')

  const threads = await getMySupportThreads()

  return (
    <div className="min-h-[100dvh] px-4 md:px-8 py-8 pb-24 md:pb-8" style={{ background: '#FAFAF7' }}>
      <div className="max-w-[720px] mx-auto">
        <h1 className="font-[family-name:var(--font-dm-sans)] text-[28px] font-medium mb-2" style={{ color: c.charcoal }}>
          Support
        </h1>
        <p className="font-[family-name:var(--font-dm-sans)] text-[14px] mb-6" style={{ color: c.stone }}>
          Need help? Open a ticket and the Kela team will get back to you.
        </p>

        <NewThreadForm />

        {threads.length > 0 && (
          <>
            <h2 className="font-[family-name:var(--font-dm-sans)] text-[16px] font-medium mt-8 mb-3" style={{ color: c.charcoal }}>
              Your tickets
            </h2>
            <div className="flex flex-col gap-2">
              {threads.map(t => (
                <Link
                  key={t.id}
                  href={`/support/${t.id}`}
                  className="rounded-[12px] px-4 py-3 no-underline flex items-center justify-between"
                  style={{ background: c.white, border: `1px solid ${c.cream2}` }}
                >
                  <div className="min-w-0">
                    <div className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium truncate" style={{ color: c.charcoal }}>
                      {t.subject}
                    </div>
                    <div className="font-[family-name:var(--font-dm-mono)] text-[10px] mt-0.5" style={{ color: c.stone }}>
                      {new Date(t.last_message_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {t.unread_for_opener && (
                      <span className="w-2 h-2 rounded-full" style={{ background: c.green }} />
                    )}
                    <span
                      className="font-[family-name:var(--font-dm-mono)] text-[9px] px-2 py-0.5 rounded-[4px] uppercase tracking-wider"
                      style={{
                        background: t.status === 'open' ? c.greenBg : c.cream,
                        color: t.status === 'open' ? c.green : c.stone,
                      }}
                    >
                      {t.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
