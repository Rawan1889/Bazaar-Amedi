'use client'

import { useEffect } from 'react'
import { recordView, type ViewedProduct } from '@/lib/bazaar/recently-viewed'

// Drop on a product page to log the view into "recently viewed".
export function RecordView({ product }: { product: ViewedProduct }) {
  useEffect(() => {
    recordView(product)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id])
  return null
}
