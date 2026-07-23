// Shared skeleton primitives used by loading.tsx files. Kept minimal and
// theme-neutral so each section can compose them without extra imports.

const c = {
  cream:  '#F2EFEA',
  cream2: '#E8E4DE',
  white:  '#FFFFFF',
  bg:     '#FAFAF7',
} as const

export function SkeletonLine({ w = '100%', h = 12, className = '' }: { w?: string | number; h?: number; className?: string }) {
  return (
    <div
      className={`rounded-[6px] animate-pulse ${className}`}
      style={{ width: typeof w === 'number' ? `${w}px` : w, height: h, background: c.cream2 }}
    />
  )
}

export function SkeletonCard({ h = 96, className = '' }: { h?: number; className?: string }) {
  return (
    <div
      className={`rounded-[14px] animate-pulse ${className}`}
      style={{ height: h, background: c.white, border: `1px solid ${c.cream2}` }}
    />
  )
}

export function SkeletonPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] pb-20 md:pb-0" style={{ background: c.bg }}>
      <div className="max-w-[1200px] mx-auto px-6 py-8 flex flex-col gap-4">
        {children}
      </div>
    </div>
  )
}
