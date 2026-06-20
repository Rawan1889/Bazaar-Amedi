'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { bazaarSignup } from '@/lib/bazaar/auth'

const c = {
  green:      '#2D8A5E',
  greenHover: '#247A51',
  greenBg:    'rgba(45,138,94,0.08)',
  greenBord:  'rgba(45,138,94,0.2)',
  terra:      '#C4654A',
  terraBg:    'rgba(196,101,74,0.08)',
  terraBord:  'rgba(196,101,74,0.2)',
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

type Role = 'customer' | 'market' | 'driver'

const roles: { id: Role; label: string; color: string; bg: string; border: string }[] = [
  { id: 'customer', label: 'Customer', color: c.green, bg: c.greenBg, border: c.greenBord },
  { id: 'market', label: 'Market Owner', color: c.terra, bg: c.terraBg, border: c.terraBord },
  { id: 'driver', label: 'Driver', color: c.charcoal, bg: 'rgba(30,28,25,0.05)', border: 'rgba(30,28,25,0.15)' },
]

function Field({
  name, label, type = 'text', placeholder, autoComplete, required = true,
}: {
  name: string; label: string; type?: string; placeholder: string; autoComplete?: string; required?: boolean
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase"
        style={{ color: c.stone }}
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full rounded-[10px] px-4 py-3 text-[14px] font-[family-name:var(--font-dm-sans)] outline-none transition-all duration-200"
        style={{
          background: c.white,
          border: `1px solid ${focused ? c.green : c.cream2}`,
          color: c.charcoal,
          boxShadow: focused ? `0 0 0 3px ${c.greenBg}` : 'none',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  )
}

function PhoneField({ name, label }: { name: string; label: string }) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase"
        style={{ color: c.stone }}
      >
        {label}
      </label>
      <div className="flex gap-2">
        <div
          className="flex items-center gap-1.5 px-3 rounded-[10px] font-[family-name:var(--font-dm-mono)] text-[13px] flex-shrink-0"
          style={{ background: c.cream, color: c.stone, border: `1px solid ${c.cream2}` }}
        >
          +964
        </div>
        <input
          id={name}
          name={name}
          type="tel"
          required
          autoComplete="tel"
          placeholder="750 123 4567"
          className="w-full rounded-[10px] px-4 py-3 text-[14px] font-[family-name:var(--font-dm-sans)] outline-none transition-all duration-200"
          style={{
            background: c.white,
            border: `1px solid ${focused ? c.green : c.cream2}`,
            color: c.charcoal,
            boxShadow: focused ? `0 0 0 3px ${c.greenBg}` : 'none',
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>
    </div>
  )
}

function SelectField({
  name, label, options,
}: {
  name: string; label: string; options: { value: string; label: string }[]
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase"
        style={{ color: c.stone }}
      >
        {label}
      </label>
      <select
        id={name}
        name={name}
        required
        className="w-full rounded-[10px] px-4 py-3 text-[14px] font-[family-name:var(--font-dm-sans)] outline-none transition-all duration-200 appearance-none cursor-pointer"
        style={{
          background: `${c.white} url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%237A756E' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") no-repeat right 14px center`,
          border: `1px solid ${focused ? c.green : c.cream2}`,
          color: c.charcoal,
          boxShadow: focused ? `0 0 0 3px ${c.greenBg}` : 'none',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        <option value="">Select...</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

function SignupFormInner() {
  const params = useSearchParams()
  const roleParam = params.get('role') as Role | null
  const [activeRole, setActiveRole] = useState<Role>(roleParam && ['customer', 'market', 'driver'].includes(roleParam) ? roleParam : 'customer')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (roleParam && ['customer', 'market', 'driver'].includes(roleParam)) {
      setActiveRole(roleParam as Role)
    }
  }, [roleParam])

  const active = roles.find(r => r.id === activeRole)!

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: c.greenBg }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M7 14l5 5L21 9" stroke={c.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="font-[family-name:var(--font-dm-sans)] text-[24px] font-medium mb-2" style={{ color: c.charcoal }}>
          You&apos;re on the list.
        </h2>
        <p className="font-[family-name:var(--font-dm-sans)] text-[15px] mb-6" style={{ color: c.stone }}>
          {activeRole === 'customer' && "We'll notify you as soon as Bazaar launches in Amedi."}
          {activeRole === 'market' && "We'll reach out to set up your shop page before launch."}
          {activeRole === 'driver' && "We'll contact you with onboarding details before launch."}
        </p>
        <a
          href="/"
          className="font-[family-name:var(--font-dm-sans)] text-[14px] no-underline transition-colors duration-200"
          style={{ color: c.green }}
        >
          Back to home
        </a>
      </div>
    )
  }

  return (
    <>
      {/* Role tabs */}
      <div className="flex gap-2 mb-8 p-1 rounded-[12px]" style={{ background: c.cream }}>
        {roles.map(role => (
          <button
            key={role.id}
            onClick={() => setActiveRole(role.id)}
            className="flex-1 py-2.5 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[13px] font-medium border-none cursor-pointer transition-all duration-200"
            style={{
              background: activeRole === role.id ? c.white : 'transparent',
              color: activeRole === role.id ? role.color : c.stone,
              boxShadow: activeRole === role.id ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            {role.label}
          </button>
        ))}
      </div>

      {/* Role badge */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ background: active.bg }}>
          <span className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ color: active.color }}>{active.label[0]}</span>
        </div>
        <div>
          <div className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: c.charcoal }}>
            {activeRole === 'customer' && 'Create your shopper account'}
            {activeRole === 'market' && 'Register your market'}
            {activeRole === 'driver' && 'Apply as a driver'}
          </div>
          <div className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stoneLight }}>
            {activeRole === 'customer' && 'Free — browse, compare, order'}
            {activeRole === 'market' && 'Get your own shop page'}
            {activeRole === 'driver' && 'Flexible hours, fair pay'}
          </div>
        </div>
      </div>

      {error && (
        <div
          className="rounded-[10px] px-4 py-3 mb-2 font-[family-name:var(--font-dm-sans)] text-[13px]"
          style={{ background: c.errorBg, color: c.error, border: `1px solid rgba(201,74,58,0.15)` }}
        >
          {error}
        </div>
      )}

      <form
        className="flex flex-col gap-4"
        action={(formData: FormData) => {
          setError(null)
          formData.set('role', activeRole)
          startTransition(async () => {
            const result = await bazaarSignup(formData)
            if (result?.error) {
              setError(result.error)
            } else if (result?.success) {
              setSubmitted(true)
            }
          })
        }}
      >
        {/* Common fields */}
        <Field name="fullName" label="Full name" placeholder="Your full name" autoComplete="name" />
        <PhoneField name="phone" label="Phone number" />
        <Field name="email" label="Email" type="email" placeholder="you@example.com" autoComplete="email" />

        {/* Customer fields */}
        {activeRole === 'customer' && (
          <>
            <SelectField
              name="neighborhood"
              label="Neighborhood"
              options={[
                { value: 'amedi-center', label: 'Amedi Center' },
                { value: 'sulav', label: 'Sulav' },
                { value: 'sarsink', label: 'Sarsink' },
                { value: 'barzan', label: 'Barzan' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </>
        )}

        {/* Market owner fields */}
        {activeRole === 'market' && (
          <>
            <Field name="shopName" label="Shop / Market name" placeholder="e.g. Ahmad's Grocery" autoComplete="organization" />
            <SelectField
              name="category"
              label="Shop category"
              options={[
                { value: 'grocery', label: 'Grocery & Essentials' },
                { value: 'butcher', label: 'Butcher & Meat' },
                { value: 'produce', label: 'Fresh Produce & Vegetables' },
                { value: 'bakery', label: 'Bakery & Bread' },
                { value: 'dairy', label: 'Dairy & Cheese' },
                { value: 'spices', label: 'Spices & Dry Goods' },
                { value: 'household', label: 'Household & Cleaning' },
                { value: 'other', label: 'Other' },
              ]}
            />
            <Field name="location" label="Shop location / address" placeholder="Near Amedi bazaar, main street" />
          </>
        )}

        {/* Driver fields */}
        {activeRole === 'driver' && (
          <>
            <SelectField
              name="vehicleType"
              label="Vehicle type"
              options={[
                { value: 'motorcycle', label: 'Motorcycle' },
                { value: 'car', label: 'Car' },
                { value: 'bicycle', label: 'Bicycle' },
                { value: 'walking', label: 'On foot' },
              ]}
            />
            <SelectField
              name="availability"
              label="Availability"
              options={[
                { value: 'fulltime', label: 'Full-time (6+ hours/day)' },
                { value: 'parttime', label: 'Part-time (3–5 hours/day)' },
                { value: 'flexible', label: 'Flexible / weekends only' },
              ]}
            />
            <Field name="idNumber" label="National ID number" placeholder="Your national ID" />
          </>
        )}

        {/* Password */}
        <Field name="password" label="Password" type="password" placeholder="At least 8 characters" autoComplete="new-password" />

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3.5 rounded-[10px] text-[14px] font-medium font-[family-name:var(--font-dm-sans)] cursor-pointer border-none transition-all duration-200 mt-2"
          style={{
            background: active.color,
            color: '#fff',
            opacity: isPending ? 0.7 : 1,
          }}
          onMouseEnter={e => !isPending && (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {isPending ? 'Creating account...' : (
            <>
              {activeRole === 'customer' && 'Create account'}
              {activeRole === 'market' && 'Register market'}
              {activeRole === 'driver' && 'Apply to deliver'}
            </>
          )}
        </button>

        <p className="text-center text-[11px] font-[family-name:var(--font-dm-sans)]" style={{ color: c.stoneLight }}>
          By signing up you agree to our Terms and Privacy Policy.
        </p>
      </form>

      <p className="text-center text-[13px] mt-5 font-[family-name:var(--font-dm-sans)]" style={{ color: c.stone }}>
        Already have an account?{' '}
        <a href="/login" className="no-underline font-medium" style={{ color: c.green }}>
          Sign in
        </a>
      </p>
    </>
  )
}

export default function BazaarSignupPage() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center py-12 px-6" style={{ background: c.bg }}>
      {/* Subtle green glow */}
      <div
        className="fixed top-0 right-0 pointer-events-none"
        style={{
          width: 500, height: 500,
          background: 'radial-gradient(circle at 80% 10%, rgba(45,138,94,0.04) 0%, transparent 60%)',
        }}
      />

      <div className="w-full max-w-[440px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-block no-underline">
            <span className="font-[family-name:var(--font-dm-sans)] text-[24px] font-medium" style={{ color: c.charcoal }}>
              bazaar<span style={{ color: c.green }}>.</span>
            </span>
          </a>
          <p className="font-[family-name:var(--font-dm-sans)] text-[14px] mt-1" style={{ color: c.stone }}>
            Join the Amedi marketplace
          </p>
        </div>

        {/* Form card */}
        <div
          className="rounded-[16px] p-7"
          style={{ background: c.white, border: `1px solid ${c.cream2}`, boxShadow: '0 4px 24px rgba(30,28,25,0.04)' }}
        >
          <Suspense fallback={<div className="h-[400px] flex items-center justify-center"><span className="font-[family-name:var(--font-dm-mono)] text-[12px]" style={{ color: c.stoneLight }}>Loading...</span></div>}>
            <SignupFormInner />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
