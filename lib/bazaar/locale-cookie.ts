import type { BazaarLocale } from './i18n'

export const LOCALE_COOKIE = 'bazaar-locale'

export function isBazaarLocale(v: unknown): v is BazaarLocale {
  return v === 'en' || v === 'ku' || v === 'ar'
}
