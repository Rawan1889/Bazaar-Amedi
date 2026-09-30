import Link from 'next/link'
import type { Metadata } from 'next'
import { KelaMark } from '@/app/components/kela-mark'

export const metadata: Metadata = { title: 'Page not found' }

export default function NotFound() {
  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-6 pb-20 md:pb-0" style={{ background: '#FAFAF7' }}>
      <div className="max-w-[420px] w-full text-center">
        <div className="flex justify-center mb-6">
          <KelaMark size={40} color="#287A53" />
        </div>
        <p className="font-[family-name:var(--font-dm-mono)] text-[12px] tracking-[0.1em] mb-2" style={{ color: '#6B665F' }}>
          404
        </p>
        <h1 className="font-[family-name:var(--font-dm-sans)] text-[22px] font-medium mb-2" style={{ color: '#1E1C19' }}>
          We couldn&apos;t find that page
        </h1>
        <p className="font-[family-name:var(--font-dm-sans)] text-[14px] leading-[1.6] mb-6" style={{ color: '#6B665F' }}>
          The product or shop may have been removed, or the link is wrong.
        </p>
        <div className="flex gap-2 justify-center flex-wrap">
          <Link
            href="/browse"
            className="min-h-[44px] px-5 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[14px] font-medium no-underline inline-flex items-center"
            style={{ background: '#287A53', color: '#fff' }}
          >
            Browse products
          </Link>
          <Link
            href="/shops"
            className="min-h-[44px] px-5 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[14px] font-medium no-underline inline-flex items-center"
            style={{ background: '#F2EFEA', color: '#1E1C19' }}
          >
            See all shops
          </Link>
        </div>
      </div>
    </main>
  )
}
