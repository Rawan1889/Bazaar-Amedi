import { SkeletonPage, SkeletonLine, SkeletonCard } from '@/app/components/skeleton'

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonLine w={200} h={26} />
      <SkeletonCard h={140} className="mt-2" />
      <SkeletonCard h={140} />
      <SkeletonCard h={140} />
    </SkeletonPage>
  )
}
