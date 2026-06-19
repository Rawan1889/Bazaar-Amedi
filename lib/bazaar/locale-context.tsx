'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { type BazaarLocale, type TranslationKey, t as translate, isRtl } from './i18n'

interface LocaleState {
  locale: BazaarLocale
  setLocale: (locale: BazaarLocale) => void
  t: (key: TranslationKey) => string
  rtl: boolean
}

const LocaleContext = createContext<LocaleState | null>(null)

const STORAGE_KEY = 'bazaar-locale'

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<BazaarLocale>(() => {
    if (typeof window === 'undefined') return 'en'
    return (localStorage.getItem(STORAGE_KEY) as BazaarLocale) || 'en'
  })

  const setLocale = useCallback((l: BazaarLocale) => {
    setLocaleState(l)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, l)
    }
  }, [])

  const t = useCallback((key: TranslationKey) => translate(key, locale), [locale])
  const rtl = isRtl(locale)

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, rtl }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
