'use client'
export const dynamic = 'force-dynamic'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useCart } from '@/lib/bazaar/cart-context'
import { placeOrder } from '@/lib/bazaar/order-actions'
import { CouponInput } from '@/app/components/coupon-input'
import { CheckoutAddress, type SelectedAddress } from '@/app/components/checkout-address'
import { DeliverySlotPicker, type SelectedSlot } from '@/app/components/delivery-slot-picker'
import { feeForZone } from '@/lib/bazaar/zone-utils'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  terra:    '#C4654A',
  saffron:  '#E8A838',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  bg:       '#FAFAF7',
  white:    '#FFFFFF',
  error:    '#C94A3A',
  errorBg:  'rgba(201,74,58,0.08)',
} as const

function formatIQD(amount: number) {
  return new Intl.NumberFormat('en-IQ').format(amount) + ' IQD'
}

export default function CartPage() {
  const { items, shopGroups, updateQuantity, removeItem, clearCart, itemCount, shopCount, subtotal } = useCart()
  const [selectedAddress, setSelectedAddress] = useState<SelectedAddress | null>(null)
  const [slot, setSlot] = useState<SelectedSlot>({ date: null, slot: null })
  const [fulfillment, setFulfillment] = useState<'delivery' | 'pickup'>('delivery')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [savedShopCount, setSavedShopCount] = useState(0)
  const [savedPickup, setSavedPickup] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [coupon, setCoupon] = useState<{ discount: number; description: string; code: string } | null>(null)

  const isPickup = fulfillment === 'pickup'
  const canPickup = shopCount === 1
  const zone = selectedAddress?.zone ?? null
  // No zone on the address (e.g. saved before zones existed) → server falls back
  // to the default 2500 fee, so mirror that here for a consistent total.
  // Pickup has no delivery fee.
  const deliveryFee = isPickup ? 0 : (zone ? feeForZone(zone, subtotal) : 2500)
  const discount = coupon?.discount || 0
  const total = Math.max(0, subtotal - discount) + deliveryFee
  const freeDelivery = !isPickup && zone?.free_delivery_threshold != null && subtotal >= zone.free_delivery_threshold
  const belowMin = !isPickup && !!zone && zone.min_order > 0 && subtotal < zone.min_order

  function handleCheckout() {
    if (!isPickup && !selectedAddress) {
      setError('Please choose or add a delivery address.')
      return
    }
    if (belowMin && zone) {
      setError(`Minimum order for ${zone.name} is ${formatIQD(zone.min_order)}.`)
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await placeOrder({
        items: items.map(i => ({
          productId: i.productId,
          shopId: i.shopId,
          name: i.name,
          price: i.price,
          salePrice: i.salePrice,
          quantity: i.quantity,
        })),
        deliveryAddress: isPickup ? `Pickup from ${shopGroups[0]?.shopName ?? 'shop'}` : (selectedAddress?.text ?? ''),
        note: note || null,
        couponCode: coupon?.code ?? null,
        addressId: isPickup ? null : (selectedAddress?.id ?? null),
        deliveryLat: isPickup ? null : (selectedAddress?.lat ?? null),
        deliveryLng: isPickup ? null : (selectedAddress?.lng ?? null),
        zoneId: isPickup ? null : (selectedAddress?.zone?.id ?? null),
        scheduledDate: slot.date,
        scheduledSlot: slot.slot,
        fulfillmentType: fulfillment,
      })
      if (result.error) {
        setError(result.error)
      } else {
        setSavedShopCount(shopCount)
        setSavedPickup(isPickup)
        clearCart()
        setSuccess(result.orderId!)
      }
    })
  }

  if (success) {
    return (
      <div className="min-h-[100dvh]" style={{ background: c.bg }}>
        <nav className="px-6 py-4" style={{ borderBottom: `1px solid ${c.cream2}` }}>
          <div className="max-w-[800px] mx-auto">
            <Link href="/" className="no-underline">
              <span className="font-[family-name:var(--font-dm-sans)] text-[20px] font-medium" style={{ color: c.charcoal }}>
                bazaar<span style={{ color: c.green }}>.</span>
              </span>
            </Link>
          </div>
        </nav>
        <div className="max-w-[800px] mx-auto px-6 py-16 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: c.greenBg }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M7 14l5 5L21 9" stroke={c.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="font-[family-name:var(--font-dm-sans)] text-[28px] font-medium mb-2" style={{ color: c.charcoal }}>
            Order placed!
          </h1>
          <p className="font-[family-name:var(--font-dm-sans)] text-[15px] mb-6" style={{ color: c.stone }}>
            {savedPickup
              ? 'The shop will prepare your order. We’ll tell you when it’s ready to collect. Pay at pickup.'
              : `A driver will pick up from ${savedShopCount} shop${savedShopCount !== 1 ? 's' : ''} and deliver to you. Cash on delivery.`}
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/orders"
              className="px-5 py-2.5 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[13px] font-medium no-underline"
              style={{ background: c.green, color: '#fff' }}
            >
              View my orders
            </Link>
            <Link
              href="/browse"
              className="px-5 py-2.5 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[13px] no-underline"
              style={{ background: c.cream, color: c.stone }}
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh]" style={{ background: c.bg }}>
      <nav className="sticky top-0 z-10 px-6 py-4" style={{ background: 'rgba(250,250,247,0.9)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${c.cream2}` }}>
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="no-underline">
              <span className="font-[family-name:var(--font-dm-sans)] text-[20px] font-medium" style={{ color: c.charcoal }}>
                bazaar<span style={{ color: c.green }}>.</span>
              </span>
            </Link>
            <span style={{ color: c.cream2 }}>/</span>
            <span className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.stone }}>Cart</span>
          </div>
          <Link href="/browse" className="font-[family-name:var(--font-dm-sans)] text-[13px] no-underline" style={{ color: c.green }}>
            Continue shopping
          </Link>
        </div>
      </nav>

      <div className="max-w-[800px] mx-auto px-6 py-8">
        <h1 className="font-[family-name:var(--font-dm-sans)] text-[28px] font-medium mb-2" style={{ color: c.charcoal }}>
          Your cart
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-[family-name:var(--font-dm-sans)] text-[15px] mb-4" style={{ color: c.stone }}>
              Your cart is empty. Browse the marketplace to add items.
            </p>
            <Link
              href="/browse"
              className="inline-block px-5 py-2.5 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[13px] font-medium no-underline"
              style={{ background: c.green, color: '#fff' }}
            >
              Browse markets
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mt-6">
            {/* Items grouped by shop */}
            <div className="flex flex-col gap-4">
              <p className="font-[family-name:var(--font-dm-sans)] text-[14px]" style={{ color: c.stone }}>
                {itemCount} item{itemCount !== 1 ? 's' : ''} from {shopCount} shop{shopCount !== 1 ? 's' : ''} — one delivery trip
              </p>

              {shopGroups.map(group => (
                <div key={group.shopId} className="rounded-[14px] overflow-hidden" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
                  <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${c.cream2}` }}>
                    <div className="w-6 h-6 rounded-[6px] flex items-center justify-center font-[family-name:var(--font-dm-sans)] text-[10px] font-medium" style={{ background: c.greenBg, color: c.green }}>
                      {group.shopName.charAt(0)}
                    </div>
                    <span className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ color: c.charcoal }}>
                      {group.shopName}
                    </span>
                  </div>

                  {group.items.map(item => (
                    <div key={item.productId} className="flex items-center gap-4 px-5 py-3" style={{ borderBottom: `1px solid ${c.cream}` }}>
                      <div className="w-12 h-12 rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ background: c.cream }}>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-[8px]" />
                        ) : (
                          <span className="font-[family-name:var(--font-dm-sans)] text-[16px] font-medium" style={{ color: c.cream2 }}>
                            {item.name.charAt(0)}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium truncate" style={{ color: c.charcoal }}>
                          {item.name}
                        </div>
                        <div className="font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ color: item.salePrice ? c.terra : c.green }}>
                          {formatIQD(item.salePrice ?? item.price)} <span style={{ color: c.stone }}>/{item.unit}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-7 h-7 rounded-[6px] flex items-center justify-center border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[14px]"
                          style={{ background: c.cream, color: c.stone }}
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ color: c.charcoal }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-7 h-7 rounded-[6px] flex items-center justify-center border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[14px]"
                          style={{ background: c.cream, color: c.stone }}
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.productId)}
                        className="p-1 border-none bg-transparent cursor-pointer"
                        style={{ color: c.stone }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Checkout sidebar */}
            <div className="lg:sticky lg:top-[80px] self-start">
              <div className="rounded-[14px] p-5" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
                <h3 className="font-[family-name:var(--font-dm-sans)] text-[16px] font-medium mb-4" style={{ color: c.charcoal }}>
                  Order summary
                </h3>

                {error && (
                  <div className="rounded-[8px] px-3 py-2 mb-4 font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ background: c.errorBg, color: c.error }}>
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-2 mb-4 pb-4" style={{ borderBottom: `1px solid ${c.cream}` }}>
                  <div className="flex justify-between font-[family-name:var(--font-dm-sans)] text-[13px]">
                    <span style={{ color: c.stone }}>Subtotal ({itemCount} items)</span>
                    <span style={{ color: c.charcoal }}>{formatIQD(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between font-[family-name:var(--font-dm-sans)] text-[13px]">
                      <span style={{ color: c.green }}>Coupon ({coupon?.description})</span>
                      <span style={{ color: c.green }}>-{formatIQD(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-[family-name:var(--font-dm-sans)] text-[13px]">
                    <span style={{ color: c.stone }}>
                      {isPickup ? 'Pickup' : `Delivery fee${zone ? ` · ${zone.name}` : ''}`}
                    </span>
                    <span style={{ color: (freeDelivery || isPickup) ? c.green : c.charcoal }}>
                      {(freeDelivery || isPickup) ? 'Free' : formatIQD(deliveryFee)}
                    </span>
                  </div>
                  {!isPickup && zone?.free_delivery_threshold != null && !freeDelivery && (
                    <div className="font-[family-name:var(--font-dm-sans)] text-[11px]" style={{ color: c.green }}>
                      Add {formatIQD(zone.free_delivery_threshold - subtotal)} more for free delivery
                    </div>
                  )}
                  {belowMin && zone && (
                    <div className="font-[family-name:var(--font-dm-sans)] text-[11px]" style={{ color: '#C94A3A' }}>
                      Minimum order for {zone.name} is {formatIQD(zone.min_order)}
                    </div>
                  )}
                  <div className="flex justify-between font-[family-name:var(--font-dm-sans)] text-[13px] font-medium pt-2">
                    <span style={{ color: c.charcoal }}>Total</span>
                    <span style={{ color: c.green }}>{formatIQD(total)}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <CouponInput
                    shopIds={shopGroups.map(g => g.shopId)}
                    subtotal={subtotal}
                    applied={coupon}
                    onApply={(d, desc, code) => setCoupon({ discount: d, description: desc, code })}
                    onRemove={() => setCoupon(null)}
                  />
                </div>

                {!isPickup && (
                  <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-[8px]" style={{ background: c.greenBg }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.green }}>
                      One driver picks up from {shopCount} shop{shopCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                <div className="flex flex-col gap-3 mb-4">
                  {/* Delivery vs pickup */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFulfillment('delivery')}
                      className="flex-1 py-2 rounded-[8px] border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[12px] font-medium transition-colors"
                      style={{ background: !isPickup ? c.green : c.white, color: !isPickup ? '#fff' : c.stone, border: `1px solid ${!isPickup ? c.green : c.cream2}` }}
                    >
                      Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => canPickup && setFulfillment('pickup')}
                      disabled={!canPickup}
                      title={canPickup ? '' : 'Pickup is available for single-shop orders'}
                      className="flex-1 py-2 rounded-[8px] border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[12px] font-medium transition-colors"
                      style={{ background: isPickup ? c.green : c.white, color: isPickup ? '#fff' : c.stone, border: `1px solid ${isPickup ? c.green : c.cream2}`, opacity: canPickup ? 1 : 0.5, cursor: canPickup ? 'pointer' : 'not-allowed' }}
                    >
                      Pickup
                    </button>
                  </div>

                  {isPickup ? (
                    <div className="rounded-[10px] p-3" style={{ background: c.greenBg }}>
                      <div className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ color: c.charcoal }}>
                        Pick up from {shopGroups[0]?.shopName}
                      </div>
                      <div className="font-[family-name:var(--font-dm-sans)] text-[12px] mt-0.5" style={{ color: c.stone }}>
                        No delivery fee. We&apos;ll tell you when it&apos;s ready to collect.
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
                        Delivery address
                      </label>
                      <CheckoutAddress onSelect={setSelectedAddress} />
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
                      Delivery time
                    </label>
                    <DeliverySlotPicker onSelect={setSlot} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
                      Note (optional)
                    </label>
                    <input
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="e.g. Ring the bell"
                      className="w-full rounded-[8px] px-3 py-2.5 text-[13px] font-[family-name:var(--font-dm-sans)] outline-none"
                      style={{ border: `1px solid ${c.cream2}`, color: c.charcoal }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isPending || belowMin}
                  className="w-full py-3 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[14px] font-medium border-none cursor-pointer transition-all duration-150"
                  style={{ background: belowMin ? c.cream2 : c.green, color: '#fff', opacity: isPending ? 0.7 : 1, cursor: belowMin ? 'not-allowed' : 'pointer' }}
                  onMouseEnter={e => !isPending && !belowMin && (e.currentTarget.style.transform = 'scale(0.98)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {isPending ? 'Placing order...' : belowMin ? 'Minimum order not met' : `Place order — ${formatIQD(total)}`}
                </button>

                <p className="text-center font-[family-name:var(--font-dm-mono)] text-[10px] mt-3" style={{ color: c.stone }}>
                  Cash on delivery
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
