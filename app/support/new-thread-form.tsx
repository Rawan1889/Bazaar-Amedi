'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { openSupportThread } from '@/lib/bazaar/support-actions'

const c = {
  green:    '#2D8A5E',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
  error:    '#C94A3A',
} as const

export function NewThreadForm() {
  const router = useRouter()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    startTransition(async () => {
      const res = await openSupportThread(subject, body)
      if (res?.error) setErr(res.error)
      else if (res?.id) router.push(`/support/${res.id}`)
    })
  }

  return (
    <form onSubmit={submit} className="rounded-[14px] p-5 flex flex-col gap-3" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
      <div>
        <label className="block font-[family-name:var(--font-dm-mono)] text-[10px] uppercase tracking-wider mb-1" style={{ color: c.stone }}>
          Subject
        </label>
        <input
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="e.g. Payout hasn't arrived"
          maxLength={120}
          className="w-full px-3 py-2 rounded-[8px] font-[family-name:var(--font-dm-sans)] text-[14px] outline-none"
          style={{ border: `1px solid ${c.cream2}`, color: c.charcoal }}
        />
      </div>
      <div>
        <label className="block font-[family-name:var(--font-dm-mono)] text-[10px] uppercase tracking-wider mb-1" style={{ color: c.stone }}>
          Message
        </label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Explain what's going on. Include order numbers if it's about a specific order."
          rows={5}
          maxLength={2000}
          className="w-full px-3 py-2 rounded-[8px] font-[family-name:var(--font-dm-sans)] text-[14px] outline-none resize-none"
          style={{ border: `1px solid ${c.cream2}`, color: c.charcoal }}
        />
      </div>
      {err && (
        <div className="font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ color: c.error }}>{err}</div>
      )}
      <button
        type="submit"
        disabled={pending || !subject.trim() || !body.trim()}
        className="self-end px-4 py-2 rounded-[8px] font-[family-name:var(--font-dm-sans)] text-[13px] font-medium border-none cursor-pointer"
        style={{ background: c.green, color: '#fff', opacity: pending || !subject.trim() || !body.trim() ? 0.5 : 1 }}
      >
        {pending ? 'Opening...' : 'Open ticket'}
      </button>
    </form>
  )
}
