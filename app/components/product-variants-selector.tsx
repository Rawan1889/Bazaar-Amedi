'use client'

import { useState } from 'react'
import { AddToCartButton } from './add-to-cart-button'

interface Variant {
  id: string
  amount: number
  unit: string
  price: number
  in_stock: boolean
  stock_qty: number | null
}

interface Props {
  productId: string
  shopId: string
  shopName: string
  shopSlug: string
  name: string
  basePrice: number
  unit: string
  imageUrl: string | null
  activeSalePrice: number | null
  variants: Variant[]
  inStock: boolean
}

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  terra:    '#C4654A',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
} as const

function formatIQD(amount: number) {
  return new Intl.NumberFormat('en-IQ').format(amount) + ' IQD'
}

export function ProductVariantsSelector({
  productId,
  shopId,
  shopName,
  shopSlug,
  name,
  basePrice,
  unit,
  imageUrl,
  activeSalePrice,
  variants,
  inStock,
}: Props) {
  // Default to the first variant if available, otherwise null
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    variants.length > 0 ? variants[0] : null
  )

  // Current price is either the selected variant's price or the base price
  const currentPrice = selectedVariant ? selectedVariant.price : basePrice
  const currentUnit = selectedVariant ? `${selectedVariant.amount} ${selectedVariant.unit}` : unit

  // Sale price applies if present
  // (Usually flash sales apply to specific variants or the base product, let's support it cleanly)
  const hasSale = activeSalePrice !== null

  return (
    <div>
      {/* Price section */}
      <div className="flex items-center gap-3 mt-3">
        {hasSale ? (
          <>
            <span className="font-[family-name:var(--font-dm-sans)] text-[22px] font-medium" style={{ color: c.terra }}>
              {formatIQD(activeSalePrice)}
            </span>
            <span className="font-[family-name:var(--font-dm-sans)] text-[15px] line-through" style={{ color: c.stone }}>
              {formatIQD(currentPrice)}
            </span>
          </>
        ) : (
          <span className="font-[family-name:var(--font-dm-sans)] text-[22px] font-medium" style={{ color: c.green }}>
            {formatIQD(currentPrice)}
          </span>
        )}
        <span className="font-[family-name:var(--font-dm-mono)] text-[11px]" style={{ color: c.stone }}>
          per {currentUnit}
        </span>
      </div>

      {/* Variants selection */}
      {variants.length > 1 && (
        <div className="mt-5">
          <div className="font-[family-name:var(--font-dm-mono)] text-[10px] uppercase tracking-[0.1em] mb-2" style={{ color: c.stone }}>
            Options
          </div>
          <div className="flex flex-col gap-2">
            {variants.map(v => {
              const isSelected = selectedVariant?.id === v.id
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  className="flex items-center justify-between rounded-[12px] px-4 py-3 cursor-pointer text-left transition-all duration-150 border"
                  style={{
                    background: isSelected ? c.greenBg : c.white,
                    borderColor: isSelected ? c.green : c.cream2,
                    boxShadow: isSelected ? '0 2px 8px rgba(45,138,94,0.04)' : 'none',
                  }}
                >
                  <span
                    className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium"
                    style={{ color: isSelected ? c.green : c.charcoal }}
                  >
                    {v.amount} {v.unit}
                  </span>
                  <span
                    className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium"
                    style={{ color: isSelected ? c.green : c.stone }}
                  >
                    {formatIQD(v.price)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Cart button */}
      <div className="mt-6">
        {inStock && (!selectedVariant || selectedVariant.in_stock) ? (
          <AddToCartButton
            productId={productId}
            variantId={selectedVariant?.id}
            shopId={shopId}
            shopName={shopName}
            shopSlug={shopSlug}
            name={selectedVariant ? `${name} (${selectedVariant.amount} ${selectedVariant.unit})` : name}
            price={currentPrice}
            salePrice={activeSalePrice}
            unit={currentUnit}
            imageUrl={imageUrl}
          />
        ) : (
          <div className="inline-block px-4 py-2 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ background: c.cream, color: c.stone }}>
            Out of stock
          </div>
        )}
      </div>
    </div>
  )
}
