'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { createBazaarClient } from '@/lib/bazaar/supabase-client'
import { getMessages, sendMessage, type ChatMessage } from '@/lib/bazaar/chat-actions'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
} as const

const roleLabel: Record<string, string> = {
  customer: 'Customer',
  driver: 'Driver',
  market_admin: 'Shop',
  super_admin: 'Admin',
}

interface Props {
  orderId: string
  currentUserId: string
  defaultOpen?: boolean
}

export function OrderChat({ orderId, currentUserId, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [body, setBody] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [unread, setUnread] = useState(0)
  const [isPending, startTransition] = useTransition()
  const endRef = useRef<HTMLDivElement>(null)

  // Initial load + realtime subscription.
  useEffect(() => {
    let active = true
    getMessages(orderId).then(m => { if (active) { setMessages(m); setLoaded(true) } })

    const supabase = createBazaarClient()
    const channel = supabase
      .channel(`order-chat-${orderId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bazaar_messages', filter: `order_id=eq.${orderId}` },
        (payload: { new: ChatMessage }) => {
          setMessages(prev => prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new])
          if (payload.new.sender_id !== currentUserId) {
            setUnread(u => (openRef.current ? 0 : u + 1))
          }
        }
      )
      .subscribe()

    return () => { active = false; supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  // Track latest "open" for the realtime callback without re-subscribing.
  const openRef = useRef(open)
  useEffect(() => { openRef.current = open; if (open) setUnread(0) }, [open])

  // Auto-scroll to newest when open.
  useEffect(() => { if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, open])

  function send() {
    const text = body.trim()
    if (!text) return
    setBody('')
    startTransition(async () => {
      const res = await sendMessage(orderId, text)
      if (res.error) setBody(text) // restore on failure
    })
  }

  return (
    <div className="rounded-[14px] overflow-hidden" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 border-none cursor-pointer bg-transparent"
      >
        <span className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <span className="font-[family-name:var(--font-dm-sans)] text-[15px] font-medium" style={{ color: c.charcoal }}>
            Order chat
          </span>
          {unread > 0 && !open && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-[family-name:var(--font-dm-mono)] text-[10px] font-bold" style={{ background: c.green, color: '#fff' }}>
              {unread}
            </span>
          )}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.stone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div style={{ borderTop: `1px solid ${c.cream2}` }}>
          <div className="max-h-[300px] overflow-y-auto px-4 py-3 flex flex-col gap-2">
            {!loaded ? (
              <div className="text-center py-4 font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ color: c.stone }}>Loading…</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-4 font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ color: c.stone }}>
                No messages yet. Say hello.
              </div>
            ) : (
              messages.map(m => {
                const mine = m.sender_id === currentUserId
                return (
                  <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                    <div className="max-w-[80%] rounded-[12px] px-3 py-2" style={{ background: mine ? c.green : c.cream, color: mine ? '#fff' : c.charcoal }}>
                      <div className="font-[family-name:var(--font-dm-sans)] text-[13px] whitespace-pre-wrap break-words">{m.body}</div>
                    </div>
                    <div className="font-[family-name:var(--font-dm-mono)] text-[9px] mt-0.5" style={{ color: c.stone }}>
                      {mine ? 'You' : (roleLabel[m.sender_role] || m.sender_role)} · {new Date(m.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )
              })
            )}
            <div ref={endRef} />
          </div>

          <div className="flex gap-2 p-3" style={{ borderTop: `1px solid ${c.cream2}` }}>
            <input
              value={body}
              onChange={e => setBody(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Type a message…"
              className="flex-1 px-3 py-2 rounded-[10px] text-[13px] font-[family-name:var(--font-dm-sans)] outline-none"
              style={{ background: c.cream, color: c.charcoal, border: `1px solid ${c.cream2}` }}
            />
            <button
              onClick={send}
              disabled={isPending || !body.trim()}
              className="px-4 py-2 rounded-[10px] border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[13px] font-medium"
              style={{ background: c.green, color: '#fff', opacity: (isPending || !body.trim()) ? 0.6 : 1 }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
