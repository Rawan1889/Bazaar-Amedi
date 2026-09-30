'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { type BazaarLocale, type TranslationKey, t as translate, isRtl } from './i18n'
import { LOCALE_COOKIE, isBazaarLocale } from './locale-cookie'

interface LocaleState {
  locale: BazaarLocale
  setLocale: (locale: BazaarLocale) => void
  t: (key: TranslationKey) => string
  rtl: boolean
}

const LocaleContext = createContext<LocaleState | null>(null)

const STORAGE_KEY = 'bazaar-locale'

function persist(l: BazaarLocale) {
  document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`
  try { localStorage.setItem(STORAGE_KEY, l) } catch {}
}

// `initialLocale` comes from the cookie on the server, so the first client
// render matches the server HTML (no hydration mismatch) and RTL is correct
// from the first paint.
export function LocaleProvider({ children, initialLocale }: { children: ReactNode; initialLocale: BazaarLocale }) {
  const [locale, setLocaleState] = useState<BazaarLocale>(initialLocale)

  const setLocale = useCallback((l: BazaarLocale) => {
    setLocaleState(l)
    persist(l)
  }, [])

  // One-time migration for people who chose a language before the cookie existed.
  useEffect(() => {
    if (document.cookie.includes(`${LOCALE_COOKIE}=`)) return
    let stored: string | null = null
    try { stored = localStorage.getItem(STORAGE_KEY) } catch {}
    if (isBazaarLocale(stored) && stored !== initialLocale) setLocale(stored)
    else persist(initialLocale)
  }, [initialLocale, setLocale])

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
