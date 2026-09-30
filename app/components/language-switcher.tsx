'use client'

import { useLocale } from '@/lib/bazaar/locale-context'
import type { BazaarLocale } from '@/lib/bazaar/i18n'

const c = {
  green:    '#287A53',
  greenBg:  'rgba(45,138,94,0.08)',
  stone:    '#716C66',
  cream:    '#F2EFEA',
} as const

// `name` is each language in its own script, which is how screen readers
// and speakers of that language expect to find it.
const locales: { code: BazaarLocale; label: string; name: string }[] = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'ku', label: 'کو', name: 'کوردی' },
  { code: 'ar', label: 'عر', name: 'العربية' },
]

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()

  return (
    <div role="group" aria-label="Language" className="flex flex-shrink-0 rounded-[8px] overflow-hidden" style={{ border: `1px solid ${c.cream}` }}>
      {locales.map(l => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLocale(l.code)}
          aria-label={l.name}
          aria-pressed={locale === l.code}
          lang={l.code}
          className="min-h-[28px] px-2 sm:px-2.5 py-1 font-[family-name:var(--font-dm-mono)] text-[10px] font-medium border-none cursor-pointer transition-colors duration-150"
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
