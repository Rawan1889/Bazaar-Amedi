'use client'

import Image from 'next/image'
import { useState } from 'react'

const c = {
  green:  '#287A53',
  cream:  '#F2EFEA',
  cream2: '#E8E4DE',
} as const

// Main image + thumbnail strip. Tapping a thumbnail swaps the main image.
export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0)
  const has = images.length > 0

  return (
    <div>
      <div className="aspect-square rounded-[16px] overflow-hidden" style={{ background: c.cream, border: `1px solid ${c.cream2}` }}>
        {has ? (
          <Image src={images[active]} alt={alt} width={800} height={800} priority sizes="(min-width: 768px) 560px, 100vw" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-[family-name:var(--font-dm-sans)] text-[64px] font-medium" style={{ color: c.cream2 }}>
              {alt.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i)}
              className="w-16 h-16 rounded-[10px] overflow-hidden flex-shrink-0 border-none cursor-pointer p-0"
              style={{ outline: i === active ? `2px solid ${c.green}` : `1px solid ${c.cream2}` }}
            >
              <Image src={src} alt={`${alt} ${i + 1}`} width={96} height={96} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
