import { SkeletonPage, SkeletonLine, SkeletonCard } from '@/app/components/skeleton'

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonLine w={220} h={28} />
      <SkeletonLine w={160} h={14} />
      <SkeletonCard h={70} className="mt-4" />
      <SkeletonCard h={180} />
      <SkeletonCard h={180} />
    </SkeletonPage>
  )
}
