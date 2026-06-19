'use client'

import { useState, useTransition } from 'react'
import { submitReview } from '@/lib/bazaar/review-actions'
import { StarRating } from './star-rating'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  saffron:  '#E8A838',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
  error:    '#C94A3A',
  errorBg:  'rgba(201,74,58,0.08)',
} as const

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  bazaar_profiles: { full_name: string } | null
}

interface Props {
  shopId: string
  reviews: Review[]
  averageRating: number
  reviewCount: number
}

export function ReviewSection({ shopId, reviews, averageRating, reviewCount }: Props) {
  const [rating, setRating] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSubmit(formData: FormData) {
    if (rating === 0) {
      setError('Please select a rating.')
      return
    }
    setError(null)
    formData.set('shopId', shopId)
    formData.set('rating', String(rating))
    startTransition(async () => {
      const result = await submitReview(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setShowForm(false)
        setRating(0)
        setTimeout(() => setSuccess(false), 3000)
      }
    })
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="font-[family-name:var(--font-dm-sans)] text-[18px] font-medium" style={{ color: c.charcoal }}>
            Reviews
          </h2>
          {reviewCount > 0 && (
            <div className="flex items-center gap-1.5">
              <StarRating rating={averageRating} size={14} />
              <span className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ color: c.saffron }}>
                {averageRating}
              </span>
              <span className="font-[family-name:var(--font-dm-mono)] text-[11px]" style={{ color: c.stone }}>
                ({reviewCount})
              </span>
            </div>
          )}
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 rounded-[8px] font-[family-name:var(--font-dm-sans)] text-[12px] font-medium border-none cursor-pointer transition-all duration-150"
            style={{ background: c.greenBg, color: c.green }}
            onMouseEnter={e => (e.currentTarget.style.background = c.green, e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.background = c.greenBg, e.currentTarget.style.color = c.green)}
          >
            Write a review
          </button>
        )}
      </div>

      {success && (
        <div className="rounded-[8px] px-3 py-2 mb-4 font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ background: c.greenBg, color: c.green }}>
          Review submitted! Thank you.
        </div>
      )}

      {showForm && (
        <form action={handleSubmit} className="rounded-[14px] p-5 mb-6" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
          {error && (
            <div className="rounded-[8px] px-3 py-2 mb-3 font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ background: c.errorBg, color: c.error }}>
              {error}
            </div>
          )}
          <div className="mb-4">
            <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase block mb-2" style={{ color: c.stone }}>
              Your rating
            </label>
            <StarRating rating={rating} size={24} interactive onChange={setRating} />
          </div>
          <div className="mb-4">
            <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase block mb-1" style={{ color: c.stone }}>
              Comment (optional)
            </label>
            <textarea
              name="comment"
              rows={3}
              placeholder="Tell others about your experience..."
              className="w-full rounded-[8px] px-3 py-2.5 text-[13px] font-[family-name:var(--font-dm-sans)] outline-none resize-none"
              style={{ border: `1px solid ${c.cream2}`, color: c.charcoal }}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded-[8px] font-[family-name:var(--font-dm-sans)] text-[12px] font-medium border-none cursor-pointer"
              style={{ background: c.green, color: '#fff', opacity: isPending ? 0.7 : 1 }}
            >
              {isPending ? 'Submitting...' : 'Submit review'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null) }}
              className="px-4 py-2 rounded-[8px] font-[family-name:var(--font-dm-sans)] text-[12px] border-none cursor-pointer"
              style={{ background: c.cream, color: c.stone }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {reviews.length === 0 && !showForm ? (
        <div className="rounded-[14px] p-8 text-center" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
          <p className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.stone }}>
            No reviews yet. Be the first to review this shop!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map(review => (
            <div key={review.id} className="rounded-[14px] p-4" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center font-[family-name:var(--font-dm-sans)] text-[10px] font-medium" style={{ background: c.greenBg, color: c.green }}>
                    {review.bazaar_profiles?.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <span className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ color: c.charcoal }}>
                    {review.bazaar_profiles?.full_name || 'Customer'}
                  </span>
                </div>
                <span className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>
                  {new Date(review.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <StarRating rating={review.rating} size={12} />
              {review.comment && (
                <p className="font-[family-name:var(--font-dm-sans)] text-[13px] mt-2" style={{ color: c.stone }}>
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
