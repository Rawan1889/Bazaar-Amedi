import { SkeletonPage, SkeletonLine, SkeletonCard } from '@/app/components/skeleton'

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonLine w={240} h={28} className="mt-2" />
      <SkeletonLine w={340} h={14} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <SkeletonCard h={120} />
        <SkeletonCard h={120} />
        <SkeletonCard h={120} />
      </div>
      <SkeletonCard h={180} className="mt-2" />
    </SkeletonPage>
  )
}
