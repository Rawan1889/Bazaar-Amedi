'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createBazaarClient } from '@/lib/bazaar/supabase-client'
import { ensureBazaarProfile } from '@/lib/bazaar/phone-auth-actions'

const c = {
  green:    '#2D8A5E',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
  error:    '#C94A3A',
} as const

type Step = 'phone' | 'code' | 'name'

export function PhoneLogin() {
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Normalise an Iraqi number to E.164: strip spaces and a leading 0, prefix +964.
  function e164(raw: string): string {
    const digits = raw.replace(/[^\d]/g, '').replace(/^0+/, '')
    return `+964${digits}`
  }

  function sendCode() {
    if (phone.replace(/[^\d]/g, '').length < 9) { setError('Enter a valid phone number.'); return }
    setError(null)
    startTransition(async () => {
      const supabase = createBazaarClient()
      const { error } = await supabase.auth.signInWithOtp({ phone: e164(phone) })
      if (error) setError(error.message)
      else setStep('code')
    })
  }

  function verifyCode() {
    if (code.trim().length < 4) { setError('Enter the code you received.'); return }
    setError(null)
    startTransition(async () => {
      const supabase = createBazaarClient()
      const { error } = await supabase.auth.verifyOtp({ phone: e164(phone), token: code.trim(), type: 'sms' })
      if (error) { setError(error.message); return }
      const res = await ensureBazaarProfile()
      if ('error' in res) setError(res.error)
      else if ('needsName' in res) setStep('name')
      else router.push(res.redirect as never)
    })
  }

  function submitName() {
    if (!name.trim()) { setError('Please enter your name.'); return }
    setError(null)
    startTransition(async () => {
      const res = await ensureBazaarProfile(name)
      if ('error' in res) setError(res.error)
      else if ('redirect' in res) router.push(res.redirect as never)
    })
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-[10px] text-[14px] font-[family-name:var(--font-dm-sans)] outline-none'
  const inputStyle = { background: c.white, color: c.charcoal, border: `1px solid ${c.cream2}` } as const
  const btnStyle = { background: c.green, color: c.white, opacity: isPending ? 0.6 : 1 } as const

  return (
    <div className="flex flex-col gap-3">
      {step === 'phone' && (
        <>
          <label className="font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ color: c.stone }}>
            Phone number
          </label>
          <div className="flex items-center gap-2">
            <span className="px-3 py-2.5 rounded-[10px] font-[family-name:var(--font-dm-mono)] text-[13px]" style={{ background: c.cream, color: c.stone }}>
              +964
            </span>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              inputMode="numeric"
              placeholder="750 123 4567"
              className={inputCls}
              style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && sendCode()}
            />
          </div>
          <button onClick={sendCode} disabled={isPending} className="py-2.5 rounded-[10px] border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={btnStyle}>
            {isPending ? 'Sending…' : 'Send code'}
          </button>
        </>
      )}

      {step === 'code' && (
        <>
          <label className="font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ color: c.stone }}>
            Enter the code sent to +964 {phone}
          </label>
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
            inputMode="numeric"
            placeholder="6-digit code"
            className={inputCls}
            style={inputStyle}
            onKeyDown={e => e.key === 'Enter' && verifyCode()}
          />
          <button onClick={verifyCode} disabled={isPending} className="py-2.5 rounded-[10px] border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={btnStyle}>
            {isPending ? 'Verifying…' : 'Verify & continue'}
          </button>
          <button onClick={() => { setStep('phone'); setCode(''); setError(null) }} className="text-center bg-transparent border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ color: c.stone }}>
            Change number
          </button>
        </>
      )}

      {step === 'name' && (
        <>
          <label className="font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ color: c.stone }}>
            Welcome! What's your name?
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your full name"
            className={inputCls}
            style={inputStyle}
            onKeyDown={e => e.key === 'Enter' && submitName()}
          />
          <button onClick={submitName} disabled={isPending} className="py-2.5 rounded-[10px] border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={btnStyle}>
            {isPending ? 'Finishing…' : 'Start shopping'}
          </button>
        </>
      )}

      {error && (
        <p className="font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ color: c.error }}>{error}</p>
      )}
    </div>
  )
}
