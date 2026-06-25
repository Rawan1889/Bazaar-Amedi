'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { type Address, deleteAddress, setDefaultAddress } from '@/lib/bazaar/address-actions'
import { AddressForm } from './address-form'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
  error:    '#C94A3A',
} as const

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const [adding, setAdding] = useState(false)
  const [, startTransition] = useTransition()
  const router = useRouter()

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-[family-name:var(--font-dm-sans)] text-[16px] font-medium" style={{ color: c.charcoal }}>
          Delivery addresses
        </h2>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[12px] font-medium"
            style={{ background: c.greenBg, color: c.green }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add address
          </button>
        )}
      </div>

      {addresses.length === 0 && !adding && (
        <p className="font-[family-name:var(--font-dm-sans)] text-[13px] mb-3" style={{ color: c.stone }}>
          No saved addresses yet. Add one to check out faster.
        </p>
      )}

      <div className="flex flex-col gap-2 mb-3">
        {addresses.map(a => (
          <div
            key={a.id}
            className="flex items-start justify-between gap-3 rounded-[12px] p-3"
            style={{ background: c.white, border: `1px solid ${a.is_default ? c.green : c.cream2}` }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ color: c.charcoal }}>
                  {a.label}
                </span>
                {a.is_default && (
                  <span className="font-[family-name:var(--font-dm-mono)] text-[9px] uppercase px-1.5 py-0.5 rounded-[4px]" style={{ background: c.greenBg, color: c.green }}>
                    Default
                  </span>
                )}
                {a.lat != null && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-label="Has map pin">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                )}
              </div>
              <div className="font-[family-name:var(--font-dm-sans)] text-[12px] mt-0.5 truncate" style={{ color: c.stone }}>
                {a.address_text}{a.neighborhood ? ` · ${a.neighborhood}` : ''}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!a.is_default && (
                <button
                  onClick={() => startTransition(async () => { await setDefaultAddress(a.id); router.refresh() })}
                  className="px-2 py-1 rounded-[6px] border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[11px]"
                  style={{ background: c.cream, color: c.green }}
                >
                  Set default
                </button>
              )}
              <button
                onClick={() => { if (confirm('Delete this address?')) startTransition(async () => { await deleteAddress(a.id); router.refresh() }) }}
                className="p-1.5 rounded-[6px] border-none cursor-pointer"
                style={{ background: 'transparent', color: c.stone }}
                aria-label="Delete address"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {adding && (
        <AddressForm
          onSaved={() => { setAdding(false); router.refresh() }}
          onCancel={() => setAdding(false)}
        />
      )}
    </div>
  )
}
