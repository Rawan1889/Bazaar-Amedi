'use client'

import { useLocale } from '@/lib/bazaar/locale-context'
import type { BazaarLocale } from '@/lib/bazaar/i18n'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
} as const

const locales: { code: BazaarLocale; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'ku', label: 'کو' },
  { code: 'ar', label: 'عر' },
]

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()

  return (
    <div className="flex rounded-[8px] overflow-hidden" style={{ border: `1px solid ${c.cream}` }}>
      {locales.map(l => (
        <button
          key={l.code}
          onClick={() => setLocale(l.code)}
          className="px-2.5 py-1 font-[family-name:var(--font-dm-mono)] text-[10px] font-medium border-none cursor-pointer transition-colors duration-150"
          style={{
            background: locale === l.code ? c.green : 'transparent',
            color: locale === l.code ? '#fff' : c.stone,
          }}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
