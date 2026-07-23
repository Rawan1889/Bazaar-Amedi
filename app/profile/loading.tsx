import { SkeletonPage, SkeletonLine, SkeletonCard } from '@/app/components/skeleton'

export default function Loading() {
  return (
    <SkeletonPage>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full animate-pulse" style={{ background: '#E8E4DE' }} />
        <div className="flex flex-col gap-2">
          <SkeletonLine w={180} h={20} />
          <SkeletonLine w={220} h={12} />
        </div>
      </div>
      <SkeletonCard h={220} className="mt-4" />
      <SkeletonCard h={180} />
    </SkeletonPage>
  )
}
