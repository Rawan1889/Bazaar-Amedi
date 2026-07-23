import { SkeletonPage, SkeletonLine, SkeletonCard } from '@/app/components/skeleton'

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonLine w={260} h={26} />
      <SkeletonLine w={340} h={14} />
      <SkeletonCard h={44} className="mt-4" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} h={220} />)}
      </div>
    </SkeletonPage>
  )
}
