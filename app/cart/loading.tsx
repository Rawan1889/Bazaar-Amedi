import { SkeletonPage, SkeletonLine, SkeletonCard } from '@/app/components/skeleton'

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonLine w={160} h={28} />
      <SkeletonCard h={220} className="mt-2" />
      <SkeletonCard h={180} />
      <SkeletonCard h={140} />
    </SkeletonPage>
  )
}
