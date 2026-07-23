import { SkeletonLine, SkeletonCard } from '@/app/components/skeleton'

export default function Loading() {
  return (
    <div style={{ background: '#FAFAF7' }} className="min-h-[100dvh] p-8">
      <SkeletonLine w={200} h={28} />
      <SkeletonLine w={320} h={14} className="mt-2" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <SkeletonCard h={110} />
        <SkeletonCard h={110} />
        <SkeletonCard h={110} />
        <SkeletonCard h={110} />
      </div>
      <SkeletonCard h={320} className="mt-6" />
    </div>
  )
}
