'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { createBazaarClient } from '@/lib/bazaar/supabase-client'
import { sendSupportMessage, closeSupportThread } from '@/lib/bazaar/support-actions'
import type { SupportMessage, SupportThread } from '@/lib/bazaar/support-actions'

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

interface Props {
  thread: SupportThread
  initialMessages: SupportMessage[]
  currentUserId: string
  viewerIsAdmin: boolean
}

export function ThreadView({ thread, initialMessages, currentUserId, viewerIsAdmin }: Props) {
  const [messages, setMessages] = useState(initialMessages)
  const [body, setBody] = useState('')
  const [pending, startTransition] = useTransition()
  const [closing, startClose] = useTransition()
  const [status, setStatus] = useState(thread.status)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createBazaarClient()
    const channel = supabase
      .channel(`support:${thread.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bazaar_support_messages', filter: `thread_id=eq.${thread.id}` },
        payload => {
          const m = payload.new as SupportMessage
          setMessages(prev => (prev.some(x => x.id === m.id) ? prev : [...prev, m]))
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [thread.id])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    const text = body
    setBody('')
    startTransition(async () => {
      const res = await sendSupportMessage(thread.id, text)
      if (res?.error) {
        setBody(text)
        alert(res.error)
      }
    })
  }

  return (
    <div className="flex flex-col" style={{ height: 'min(80vh, 700px)' }}>
      <header className="flex items-center justify-between px-1 pb-4 mb-3" style={{ borderBottom: `1px solid ${c.cream2}` }}>
        <div>
          <h1 className="font-[family-name:var(--font-dm-sans)] text-[18px] font-medium m-0" style={{ color: c.charcoal }}>
            {thread.subject}
          </h1>
          <div className="font-[family-name:var(--font-dm-mono)] text-[10px] mt-1 capitalize" style={{ color: c.stone }}>
            {thread.opener_role.replace('_', ' ')}
            {thread.opener?.full_name ? ` · ${thread.opener.full_name}` : ''}
            {thread.opener?.phone ? ` · ${thread.opener.phone}` : ''}
            {' · '}
            <span style={{ color: status === 'closed' ? c.stone : c.green }}>{status}</span>
          </div>
        </div>
        {status === 'open' && (
          <button
            disabled={closing}
            onClick={() => startClose(async () => {
              const res = await closeSupportThread(thread.id)
              if (res?.error) alert(res.error)
              else setStatus('closed')
            })}
            className="px-3 py-1.5 rounded-[6px] font-[family-name:var(--font-dm-sans)] text-[11px] font-medium border-none cursor-pointer"
            style={{ background: c.cream, color: c.stone }}
          >
            {closing ? '...' : 'Close ticket'}
          </button>
        )}
      </header>

      <div ref={listRef} className="flex-1 overflow-y-auto py-2 pr-1 flex flex-col gap-3">
        {messages.map(m => {
          const mine = m.sender_id === currentUserId
          const fromAdmin = m.sender_role === 'super_admin'
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[80%] px-3.5 py-2.5 rounded-[14px]"
                style={{
                  background: mine ? c.green : fromAdmin ? c.greenBg : c.cream,
                  color: mine ? '#fff' : c.charcoal,
                  borderTopRightRadius: mine ? 4 : 14,
                  borderTopLeftRadius: mine ? 14 : 4,
                }}
              >
                <div className="font-[family-name:var(--font-dm-mono)] text-[9px] mb-0.5 opacity-70 capitalize">
                  {fromAdmin ? 'Kela support' : m.sender_role.replace('_', ' ')}
                </div>
                <div className="font-[family-name:var(--font-dm-sans)] text-[14px] whitespace-pre-wrap">{m.body}</div>
                <div className="font-[family-name:var(--font-dm-mono)] text-[9px] mt-1 opacity-60">
                  {new Date(m.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {status === 'open' ? (
        <form onSubmit={submit} className="mt-3 flex gap-2 pt-3" style={{ borderTop: `1px solid ${c.cream2}` }}>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(e as unknown as React.FormEvent) }}
            rows={2}
            placeholder={viewerIsAdmin ? 'Reply to this ticket...' : 'Type your message...'}
            className="flex-1 px-3 py-2 rounded-[8px] font-[family-name:var(--font-dm-sans)] text-[14px] resize-none outline-none"
            style={{ background: c.white, border: `1px solid ${c.cream2}`, color: c.charcoal }}
            disabled={pending}
          />
          <button
            type="submit"
            disabled={pending || !body.trim()}
            className="px-4 py-2 rounded-[8px] font-[family-name:var(--font-dm-sans)] text-[13px] font-medium border-none cursor-pointer self-end"
            style={{ background: c.green, color: '#fff', opacity: pending || !body.trim() ? 0.5 : 1 }}
          >
            Send
          </button>
        </form>
      ) : (
        <div className="mt-3 pt-3 font-[family-name:var(--font-dm-sans)] text-[12px] text-center" style={{ color: c.stone, borderTop: `1px solid ${c.cream2}` }}>
          This ticket is closed.
        </div>
      )}
    </div>
  )
}
