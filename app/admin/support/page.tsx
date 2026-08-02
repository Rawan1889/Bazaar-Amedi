import Link from 'next/link'
import { getAllSupportThreads } from '@/lib/bazaar/support-actions'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
  terra:    '#C4654A',
  terraBg:  'rgba(196,101,74,0.08)',
} as const

export default async function AdminSupportPage() {
  const threads = await getAllSupportThreads()
  const open = threads.filter(t => t.status === 'open')
  const closed = threads.filter(t => t.status === 'closed')

  return (
    <div>
      <h1 className="font-[family-name:var(--font-dm-sans)] text-[28px] font-medium mb-1" style={{ color: c.charcoal }}>
        Support inbox
      </h1>
      <p className="font-[family-name:var(--font-dm-sans)] text-[13px] mb-6" style={{ color: c.stone }}>
        {open.length} open · {closed.length} closed
      </p>

      <Section title="Open" list={open} />
      {closed.length > 0 && <Section title="Closed" list={closed} muted />}
    </div>
  )
}

function Section({ title, list, muted }: { title: string; list: Awaited<ReturnType<typeof getAllSupportThreads>>; muted?: boolean }) {
  return (
    <div className="mb-8">
      <h2 className="font-[family-name:var(--font-dm-mono)] text-[10px] uppercase tracking-wider mb-2" style={{ color: c.stone }}>
        {title}
      </h2>
      {list.length === 0 ? (
        <div className="rounded-[12px] px-4 py-6 font-[family-name:var(--font-dm-sans)] text-[13px] text-center" style={{ background: c.white, border: `1px solid ${c.cream2}`, color: c.stone }}>
          Nothing here.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map(t => (
            <Link
              key={t.id}
              href={`/admin/support/${t.id}`}
              className="rounded-[12px] px-4 py-3 no-underline flex items-center justify-between"
              style={{ background: c.white, border: `1px solid ${c.cream2}`, opacity: muted ? 0.7 : 1 }}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {t.unread_for_admin && !muted && (
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.terra }} />
                  )}
                  <span className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium truncate" style={{ color: c.charcoal }}>
                    {t.subject}
                  </span>
                </div>
                <div className="font-[family-name:var(--font-dm-mono)] text-[10px] mt-0.5 capitalize" style={{ color: c.stone }}>
                  {t.opener_role.replace('_', ' ')}
                  {t.opener?.full_name ? ` · ${t.opener.full_name}` : ''}
                  {' · '}
                  {new Date(t.last_message_at).toLocaleString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
