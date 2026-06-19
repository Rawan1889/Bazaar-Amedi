'use client'
export const dynamic = 'force-dynamic'

import { useState, useTransition } from 'react'
import { bazaarLogin } from '@/lib/bazaar/auth'

const c = {
  green:      '#2D8A5E',
  greenBg:    'rgba(45,138,94,0.08)',
  charcoal:   '#1E1C19',
  stone:      '#7A756E',
  stoneLight: '#9A958E',
  cream:      '#F2EFEA',
  cream2:     '#E8E4DE',
  bg:         '#FAFAF7',
  white:      '#FFFFFF',
  error:      '#C94A3A',
  errorBg:    'rgba(201,74,58,0.08)',
} as const

export default function BazaarLoginPage() {
  const [focused, setFocused] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="min-h-[100dvh] flex items-center justify-center py-12 px-6" style={{ background: c.bg }}>
      <div
        className="fixed top-0 right-0 pointer-events-none"
        style={{
          width: 500, height: 500,
          background: 'radial-gradient(circle at 80% 10%, rgba(45,138,94,0.04) 0%, transparent 60%)',
        }}
      />

      <div className="w-full max-w-[440px]">
        <div className="text-center mb-8">
          <a href="/" className="inline-block no-underline">
            <span className="font-[family-name:var(--font-dm-sans)] text-[24px] font-medium" style={{ color: c.charcoal }}>
              bazaar<span style={{ color: c.green }}>.</span>
            </span>
          </a>
          <p className="font-[family-name:var(--font-dm-sans)] text-[14px] mt-1" style={{ color: c.stone }}>
            Sign in to your account
          </p>
        </div>

        <div
          className="rounded-[16px] p-7"
          style={{ background: c.white, border: `1px solid ${c.cream2}`, boxShadow: '0 4px 24px rgba(30,28,25,0.04)' }}
        >
          {error && (
            <div
              className="rounded-[10px] px-4 py-3 mb-5 font-[family-name:var(--font-dm-sans)] text-[13px]"
              style={{ background: c.errorBg, color: c.error, border: '1px solid rgba(201,74,58,0.15)' }}
            >
              {error}
            </div>
          )}

          <form
            className="flex flex-col gap-4"
            action={(formData: FormData) => {
              setError(null)
              startTransition(async () => {
                const result = await bazaarLogin(formData)
                if (result?.error) {
                  setError(result.error)
                }
              })
            }}
          >
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="identifier"
                className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase"
                style={{ color: c.stone }}
              >
                Phone number or email
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                required
                autoComplete="username"
                placeholder="750 123 4567 or you@email.com"
                className="w-full rounded-[10px] px-4 py-3 text-[14px] font-[family-name:var(--font-dm-sans)] outline-none transition-all duration-200"
                style={{
                  background: c.white,
                  border: `1px solid ${focused === 'id' ? c.green : c.cream2}`,
                  color: c.charcoal,
                  boxShadow: focused === 'id' ? `0 0 0 3px ${c.greenBg}` : 'none',
                }}
                onFocus={() => setFocused('id')}
                onBlur={() => setFocused(null)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase"
                style={{ color: c.stone }}
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="Your password"
                className="w-full rounded-[10px] px-4 py-3 text-[14px] font-[family-name:var(--font-dm-sans)] outline-none transition-all duration-200"
                style={{
                  background: c.white,
                  border: `1px solid ${focused === 'pw' ? c.green : c.cream2}`,
                  color: c.charcoal,
                  boxShadow: focused === 'pw' ? `0 0 0 3px ${c.greenBg}` : 'none',
                }}
                onFocus={() => setFocused('pw')}
                onBlur={() => setFocused(null)}
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 rounded-[10px] text-[14px] font-medium font-[family-name:var(--font-dm-sans)] cursor-pointer border-none transition-all duration-200 mt-2"
              style={{
                background: c.green,
                color: '#fff',
                opacity: isPending ? 0.7 : 1,
              }}
              onMouseEnter={e => !isPending && (e.currentTarget.style.transform = 'scale(0.98)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {isPending ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-[13px] mt-5 font-[family-name:var(--font-dm-sans)]" style={{ color: c.stone }}>
            Don&apos;t have an account?{' '}
            <a href="/signup" className="no-underline font-medium" style={{ color: c.green }}>
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
