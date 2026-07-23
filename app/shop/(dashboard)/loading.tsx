import { SkeletonLine, SkeletonCard } from '@/app/components/skeleton'

export default function Loading() {
  return (
    <div>
      <SkeletonLine w={200} h={28} />
      <SkeletonLine w={320} h={14} className="mt-2" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <SkeletonCard h={120} />
        <SkeletonCard h={120} />
        <SkeletonCard h={120} />
      </div>
      <SkeletonCard h={240} className="mt-6" />
      <SkeletonCard h={140} className="mt-4" />
    </div>
  )
}
