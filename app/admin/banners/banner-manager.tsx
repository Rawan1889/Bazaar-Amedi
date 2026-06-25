'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createBanner, toggleBanner, deleteBanner, type PromoBanner } from '@/lib/bazaar/banner-actions'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
  error:    '#C94A3A',
} as const

function isLive(b: PromoBanner): boolean {
  const now = Date.now()
  return b.is_active && new Date(b.starts_at).getTime() <= now && new Date(b.ends_at).getTime() >= now
}

export function BannerManager({ banners }: { banners: PromoBanner[] }) {
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function submit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await createBanner(formData)
      if (res.error) setError(res.error)
      else { setAdding(false); router.refresh() }
    })
  }

  const inputStyle = { background: c.white, color: c.charcoal, border: `1px solid ${c.cream2}` } as const
  const labelStyle = 'block font-[family-name:var(--font-dm-sans)] text-[11px] mb-1'

  return (
    <div>
      <div className="flex flex-col gap-2 mb-4">
        {banners.map(b => (
          <div key={b.id} className="flex items-start justify-between gap-3 rounded-[12px] p-4" style={{ background: c.white, border: `1px solid ${isLive(b) ? c.green : c.cream2}` }}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: c.charcoal }}>{b.title}</span>
                {isLive(b) && (
                  <span className="font-[family-name:var(--font-dm-mono)] text-[9px] uppercase px-1.5 py-0.5 rounded-[4px]" style={{ background: c.greenBg, color: c.green }}>Live</span>
                )}
              </div>
              {b.message && <div className="font-[family-name:var(--font-dm-sans)] text-[12px] mt-0.5" style={{ color: c.stone }}>{b.message}</div>}
              <div className="font-[family-name:var(--font-dm-mono)] text-[10px] mt-1" style={{ color: c.stone }}>
                until {new Date(b.ends_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                {b.link_url ? ` · links to ${b.link_url}` : ''}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => startTransition(async () => { await toggleBanner(b.id, !b.is_active); router.refresh() })}
                className="px-2.5 py-1 rounded-[6px] border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[12px]"
                style={{ background: c.cream, color: b.is_active ? c.stone : c.green }}
              >
                {b.is_active ? 'Disable' : 'Enable'}
              </button>
              <button
                onClick={() => { if (confirm('Delete this banner?')) startTransition(async () => { await deleteBanner(b.id); router.refresh() }) }}
                className="p-1.5 rounded-[6px] border-none cursor-pointer" style={{ background: 'transparent', color: c.stone }} aria-label="Delete banner"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {adding ? (
        <form action={submit} className="rounded-[12px] p-4" style={{ background: c.cream, border: `1px solid ${c.cream2}` }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className={labelStyle} style={{ color: c.stone }}>Title</label>
              <input name="title" placeholder="e.g. Eid offers are here" className="w-full px-3 py-2 rounded-[8px] text-[13px] font-[family-name:var(--font-dm-sans)] outline-none" style={inputStyle} />
            </div>
            <div className="md:col-span-2">
              <label className={labelStyle} style={{ color: c.stone }}>Message (optional)</label>
              <input name="message" placeholder="Short line shown under the title" className="w-full px-3 py-2 rounded-[8px] text-[13px] font-[family-name:var(--font-dm-sans)] outline-none" style={inputStyle} />
            </div>
            <div>
              <label className={labelStyle} style={{ color: c.stone }}>Button link (optional)</label>
              <input name="link_url" placeholder="/browse?category=sweets" className="w-full px-3 py-2 rounded-[8px] text-[13px] font-[family-name:var(--font-dm-sans)] outline-none" style={inputStyle} />
            </div>
            <div>
              <label className={labelStyle} style={{ color: c.stone }}>Button label (optional)</label>
              <input name="link_label" placeholder="Shop the offer" className="w-full px-3 py-2 rounded-[8px] text-[13px] font-[family-name:var(--font-dm-sans)] outline-none" style={inputStyle} />
            </div>
            <div className="md:col-span-2">
              <label className={labelStyle} style={{ color: c.stone }}>Show until</label>
              <input name="ends_at" type="datetime-local" className="w-full px-3 py-2 rounded-[8px] text-[13px] font-[family-name:var(--font-dm-sans)] outline-none" style={inputStyle} />
            </div>
          </div>
          {error && <p className="font-[family-name:var(--font-dm-sans)] text-[12px] mt-2" style={{ color: c.error }}>{error}</p>}
          <div className="flex gap-2 mt-3">
            <button type="submit" disabled={isPending} className="px-4 py-2 rounded-[8px] border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ background: c.green, color: c.white, opacity: isPending ? 0.6 : 1 }}>
              {isPending ? 'Saving…' : 'Schedule banner'}
            </button>
            <button type="button" onClick={() => setAdding(false)} className="px-4 py-2 rounded-[8px] cursor-pointer font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ background: c.white, color: c.stone, border: `1px solid ${c.cream2}` }}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ background: c.greenBg, color: c.green }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New banner
        </button>
      )}
    </div>
  )
}
