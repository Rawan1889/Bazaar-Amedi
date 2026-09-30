'use client'

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react'

const c = {
  green:    '#2D8A5E',
  terra:    '#C4654A',
  charcoal: '#1E1C19',
  stone:    '#6B665F',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
} as const

type DialogOptions = {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
}
type PromptOptions = DialogOptions & { placeholder?: string; defaultValue?: string }

type Request =
  | { kind: 'confirm'; opts: DialogOptions; resolve: (v: boolean) => void }
  | { kind: 'alert'; opts: DialogOptions; resolve: () => void }
  | { kind: 'prompt'; opts: PromptOptions; resolve: (v: string | null) => void }

type DialogApi = {
  confirm: (opts: DialogOptions) => Promise<boolean>
  alert: (opts: DialogOptions) => Promise<void>
  prompt: (opts: PromptOptions) => Promise<string | null>
}

const DialogContext = createContext<DialogApi | null>(null)

export function useDialog(): DialogApi {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error('useDialog must be used inside <DialogProvider>')
  return ctx
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [req, setReq] = useState<Request | null>(null)

  const confirm = useCallback((opts: DialogOptions) =>
    new Promise<boolean>(resolve => setReq({ kind: 'confirm', opts, resolve })), [])
  const alert = useCallback((opts: DialogOptions) =>
    new Promise<void>(resolve => setReq({ kind: 'alert', opts, resolve })), [])
  const prompt = useCallback((opts: PromptOptions) =>
    new Promise<string | null>(resolve => setReq({ kind: 'prompt', opts, resolve })), [])

  return (
    <DialogContext.Provider value={{ confirm, alert, prompt }}>
      {children}
      {req && <DialogView req={req} onDone={() => setReq(null)} />}
    </DialogContext.Provider>
  )
}

function DialogView({ req, onDone }: { req: Request; onDone: () => void }) {
  const { opts } = req
  const titleId = useId()
  const descId = useId()
  const [value, setValue] = useState(req.kind === 'prompt' ? req.opts.defaultValue ?? '' : '')
  const panelRef = useRef<HTMLDivElement>(null)
  const primaryRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const cancel = useCallback(() => {
    if (req.kind === 'confirm') req.resolve(false)
    else if (req.kind === 'prompt') req.resolve(null)
    else req.resolve()
    onDone()
  }, [req, onDone])

  const accept = useCallback(() => {
    if (req.kind === 'confirm') req.resolve(true)
    else if (req.kind === 'prompt') req.resolve(value)
    else req.resolve()
    onDone()
  }, [req, value, onDone])

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    ;(inputRef.current ?? primaryRef.current)?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
      previouslyFocused?.focus?.()
    }
  }, [])

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); cancel(); return }
    if (e.key !== 'Tab' || !panelRef.current) return
    const focusable = panelRef.current.querySelectorAll<HTMLElement>('button, textarea, input')
    if (!focusable.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }

  const danger = opts.tone === 'danger'
  const confirmLabel = opts.confirmLabel ?? (req.kind === 'alert' ? 'OK' : 'Confirm')

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-3 md:p-4"
      style={{ background: 'rgba(30,28,25,0.45)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) cancel() }}
      onKeyDown={onKeyDown}
    >
      <div
        ref={panelRef}
        role={req.kind === 'alert' ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={opts.message ? descId : undefined}
        className="w-full max-w-[420px] rounded-[18px] p-5 md:p-6 mb-[env(safe-area-inset-bottom)]"
        style={{ background: c.white, border: `1px solid ${c.cream2}`, boxShadow: '0 20px 60px rgba(30,28,25,0.2)' }}
      >
        <h2 id={titleId} className="font-[family-name:var(--font-dm-sans)] text-[17px] font-medium m-0" style={{ color: c.charcoal }}>
          {opts.title}
        </h2>
        {opts.message && (
          <p id={descId} className="font-[family-name:var(--font-dm-sans)] text-[14px] leading-[1.55] mt-2 mb-0" style={{ color: c.stone }}>
            {opts.message}
          </p>
        )}

        {req.kind === 'prompt' && (
          <textarea
            ref={inputRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={req.opts.placeholder}
            aria-label={opts.title}
            rows={3}
            className="w-full mt-4 px-3 py-2.5 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[14px] resize-none outline-none focus:ring-2 focus:ring-[#2D8A5E]"
            style={{ border: `1px solid ${c.cream2}`, color: c.charcoal }}
          />
        )}

        <div className="flex gap-2 justify-end mt-5">
          {req.kind !== 'alert' && (
            <button
              type="button"
              onClick={cancel}
              className="min-h-[44px] px-4 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[14px] font-medium border-none cursor-pointer"
              style={{ background: c.cream, color: c.charcoal }}
            >
              {opts.cancelLabel ?? 'Cancel'}
            </button>
          )}
          <button
            ref={primaryRef}
            type="button"
            onClick={accept}
            className="min-h-[44px] px-5 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[14px] font-medium border-none cursor-pointer"
            style={{ background: danger ? c.terra : c.green, color: '#fff' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
