'use client'

import { useLocale } from '@/lib/bazaar/locale-context'
import { LEGAL, LEGAL_UPDATED, type LegalDoc } from '@/lib/bazaar/legal-content'

export function LegalPage({ doc }: { doc: LegalDoc }) {
  const { locale, rtl } = useLocale()
  const text = LEGAL[doc][locale]
  const other = doc === 'terms' ? 'privacy' : 'terms'

  return (
    <main className="min-h-[100dvh] bg-[#FAFAF7] text-[#1E1C19] px-4 py-12 md:py-20" dir={rtl ? 'rtl' : 'ltr'}>
      <article className="max-w-[720px] mx-auto">
        <a href="/" className="font-[family-name:var(--font-dm-sans)] text-[18px] font-medium no-underline text-[#1E1C19]">
          kela<span className="text-[#2D8A5E]">.</span>
        </a>
        <h1 className="mt-8 text-3xl md:text-4xl font-medium tracking-tight font-[family-name:var(--font-dm-sans)]">{text.title}</h1>
        <p className="mt-2 text-[12px] text-[#716C66] font-[family-name:var(--font-dm-mono)]">
          {text.updatedLabel}: {LEGAL_UPDATED}
        </p>
        <p className="mt-6 text-[15px] leading-relaxed text-[#3D3A35]">{text.intro}</p>

        {text.sections.map(s => (
          <section key={s.heading} className="mt-8">
            <h2 className="text-[17px] font-medium">{s.heading}</h2>
            {s.body.map((p, i) => (
              <p key={i} className="mt-2 text-[15px] leading-relaxed text-[#3D3A35]">{p}</p>
            ))}
          </section>
        ))}

        <p className="mt-10 pt-6 border-t border-[#E8E4DE] text-[14px] text-[#716C66]">
          {text.contact}{' '}
          <a href="/support" className="text-[#2D8A5E]">/support</a>
        </p>
        <p className="mt-4 text-[14px]">
          <a href={`/${other}`} className="text-[#2D8A5E]">{LEGAL[other][locale].title}</a>
        </p>
      </article>
    </main>
  )
}
