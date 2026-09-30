'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { KelaMark } from '@/app/components/kela-mark'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-6 pb-20 md:pb-0" style={{ background: '#FAFAF7' }}>
      <div className="max-w-[420px] w-full text-center">
        <div className="flex justify-center mb-6">
          <KelaMark size={40} color="#287A53" />
        </div>
        <h1 className="font-[family-name:var(--font-dm-sans)] text-[22px] font-medium mb-2" style={{ color: '#1E1C19' }}>
          Something went wrong
        </h1>
        <p className="font-[family-name:var(--font-dm-sans)] text-[14px] leading-[1.6] mb-6" style={{ color: '#6B665F' }}>
          This page couldn&apos;t load. Check your connection and try again.
        </p>
        <div className="flex gap-2 justify-center">
          <button
            type="button"
            onClick={reset}
            className="min-h-[44px] px-5 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[14px] font-medium border-none cursor-pointer"
            style={{ background: '#287A53', color: '#fff' }}
          >
            Try again
          </button>
          <Link
            href="/"
            className="min-h-[44px] px-5 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[14px] font-medium no-underline inline-flex items-center"
            style={{ background: '#F2EFEA', color: '#1E1C19' }}
          >
            Go home
          </Link>
        </div>
        {error.digest && (
          <p className="font-[family-name:var(--font-dm-mono)] text-[10px] mt-6" style={{ color: '#6B665F' }}>
            Ref: {error.digest}
          </p>
        )}
      </div>
    </main>
  )
}
