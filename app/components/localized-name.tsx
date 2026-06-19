'use client'

import { useLocale } from '@/lib/bazaar/locale-context'

interface Props {
  en: string
  ku?: string | null
  ar?: string | null
  className?: string
  style?: React.CSSProperties
}

export function LocalizedName({ en, ku, ar, className, style }: Props) {
  const { locale } = useLocale()

  let name = en
  if (locale === 'ku' && ku) name = ku
  if (locale === 'ar' && ar) name = ar

  return <span className={className} style={style} dir={locale !== 'en' ? 'auto' : undefined}>{name}</span>
}
