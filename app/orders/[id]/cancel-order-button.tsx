'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useDialog } from '@/app/components/dialog-provider'
import { cancelOrder } from '@/lib/bazaar/order-actions'

// Shown on a pending order's detail page — the same cancel the orders list offers.
export function CancelOrderButton({ orderId }: { orderId: string }) {
  const dialog = useDialog()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={async () => {
        if (!(await dialog.confirm({ title: 'Cancel this order?', confirmLabel: 'Cancel order', cancelLabel: 'Keep order', tone: 'danger' }))) return
        startTransition(async () => {
          const res = await cancelOrder(orderId)
          if (res?.error) dialog.alert({ title: 'Could not cancel', message: res.error })
          else router.refresh()
        })
      }}
      disabled={isPending}
      className="w-full mt-4 py-3 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[13px] font-medium cursor-pointer bg-transparent disabled:opacity-50"
      style={{ color: '#A8563F', border: '1px solid rgba(196,101,74,0.35)' }}
    >
      {isPending ? 'Cancelling…' : 'Cancel order'}
    </button>
  )
}
