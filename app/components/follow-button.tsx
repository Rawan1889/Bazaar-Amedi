'use client'

import { useState, useTransition } from 'react'
import { toggleFollow } from '@/lib/bazaar/follower-actions'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
} as const

interface Props {
  shopId: string
  initialFollowing: boolean
  followerCount: number
}

export function FollowButton({ shopId, initialFollowing, followerCount }: Props) {
  const [following, setFollowing] = useState(initialFollowing)
  const [count, setCount] = useState(followerCount)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleFollow(shopId)
      if (result.success) {
        setFollowing(result.following!)
        setCount(prev => result.following ? prev + 1 : prev - 1)
      }
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] font-[family-name:var(--font-dm-sans)] text-[12px] font-medium border-none cursor-pointer transition-all duration-150"
      style={{
        background: following ? c.green : c.cream,
        color: following ? '#fff' : c.stone,
        opacity: isPending ? 0.7 : 1,
      }}
      onMouseEnter={e => !following && (e.currentTarget.style.background = c.greenBg, e.currentTarget.style.color = c.green)}
      onMouseLeave={e => !following && (e.currentTarget.style.background = c.cream, e.currentTarget.style.color = c.stone)}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill={following ? '#fff' : 'none'} stroke={following ? '#fff' : c.stone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
      {following ? 'Following' : 'Follow'}
      {count > 0 && (
        <span className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ opacity: 0.7 }}>
          {count}
        </span>
      )}
    </button>
  )
}
