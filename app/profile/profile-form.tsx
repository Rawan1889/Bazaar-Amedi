'use client'

import { useState, useTransition } from 'react'
import { updateProfile } from '@/lib/bazaar/profile-actions'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream2:   '#E8E4DE',
  error:    '#C94A3A',
  errorBg:  'rgba(201,74,58,0.08)',
} as const

interface Props {
  profile: {
    full_name: string
    phone: string
    neighborhood: string | null
  }
}

export function ProfileForm({ profile }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSubmit(formData: FormData) {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await updateProfile(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    })
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="rounded-[8px] px-3 py-2 font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ background: c.errorBg, color: c.error }}>
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-[8px] px-3 py-2 font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ background: c.greenBg, color: c.green }}>
          Profile updated successfully.
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
          Full name
        </label>
        <input
          name="fullName"
          defaultValue={profile.full_name}
          required
          className="w-full rounded-[8px] px-3 py-2.5 text-[13px] font-[family-name:var(--font-dm-sans)] outline-none"
          style={{ border: `1px solid ${c.cream2}`, color: c.charcoal }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
          Phone
        </label>
        <input
          name="phone"
          defaultValue={profile.phone}
          required
          className="w-full rounded-[8px] px-3 py-2.5 text-[13px] font-[family-name:var(--font-dm-sans)] outline-none"
          style={{ border: `1px solid ${c.cream2}`, color: c.charcoal }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
          Neighborhood
        </label>
        <input
          name="neighborhood"
          defaultValue={profile.neighborhood || ''}
          placeholder="e.g. Ashkawt, Darband"
          className="w-full rounded-[8px] px-3 py-2.5 text-[13px] font-[family-name:var(--font-dm-sans)] outline-none"
          style={{ border: `1px solid ${c.cream2}`, color: c.charcoal }}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="self-start px-5 py-2.5 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[13px] font-medium border-none cursor-pointer transition-all duration-150"
        style={{ background: c.green, color: '#fff', opacity: isPending ? 0.7 : 1 }}
        onMouseEnter={e => !isPending && (e.currentTarget.style.transform = 'scale(0.98)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {isPending ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  )
}
