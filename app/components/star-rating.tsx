'use client'

const c = {
  saffron: '#E8A838',
  cream2:  '#E8E4DE',
} as const

interface Props {
  rating: number
  size?: number
  interactive?: boolean
  onChange?: (rating: number) => void
}

export function StarRating({ rating, size = 14, interactive = false, onChange }: Props) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => {
        const filled = star <= Math.round(rating)
        return (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onChange?.(star)}
            disabled={!interactive}
            className="border-none bg-transparent p-0 transition-transform duration-100"
            style={{ cursor: interactive ? 'pointer' : 'default' }}
            onMouseEnter={e => interactive && (e.currentTarget.style.transform = 'scale(1.2)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? c.saffron : 'none'} stroke={filled ? c.saffron : c.cream2} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        )
      })}
    </div>
  )
}
