'use client'

import { useState, useTransition } from 'react'
import { addAddress } from '@/lib/bazaar/address-actions'
import { LocationPicker } from './location-picker'

const c = {
  green:    '#2D8A5E',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
  error:    '#C94A3A',
} as const

const LABELS = ['Home', 'Work', 'Other']

interface Props {
  onSaved?: (id: string) => void
  onCancel?: () => void
}

export function AddressForm({ onSaved, onCancel }: Props) {
  const [label, setLabel] = useState('Home')
  const [addressText, setAddressText] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function save() {
    if (!addressText.trim()) { setError('Please describe the address (house, street, landmark).'); return }
    setError(null)
    startTransition(async () => {
      const res = await addAddress({ label, addressText, neighborhood, lat, lng })
      if (res.error) setError(res.error)
      else { onSaved?.(res.id!); setAddressText(''); setNeighborhood('') }
    })
  }

  const inputStyle = {
    background: c.white, color: c.charcoal, border: `1px solid ${c.cream2}`,
  } as const

  return (
    <div className="rounded-[14px] p-4" style={{ background: c.cream, border: `1px solid ${c.cream2}` }}>
      <div className="flex gap-2 mb-3">
        {LABELS.map(l => (
          <button
            key={l}
            type="button"
            onClick={() => setLabel(l)}
            className="px-3 py-1.5 rounded-[8px] border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[12px] transition-colors"
            style={{
              background: label === l ? c.green : c.white,
              color: label === l ? c.white : c.stone,
              border: `1px solid ${label === l ? c.green : c.cream2}`,
            }}
          >
            {l}
          </button>
        ))}
      </div>

      <label className="block font-[family-name:var(--font-dm-sans)] text-[12px] mb-1" style={{ color: c.stone }}>
        Address details
      </label>
      <input
        value={addressText}
        onChange={e => setAddressText(e.target.value)}
        placeholder="House, street, nearest landmark"
        className="w-full px-3 py-2.5 rounded-[10px] text-[13px] font-[family-name:var(--font-dm-sans)] outline-none mb-3"
        style={inputStyle}
      />

      <label className="block font-[family-name:var(--font-dm-sans)] text-[12px] mb-1" style={{ color: c.stone }}>
        Neighborhood <span style={{ color: c.cream2 }}>(optional)</span>
      </label>
      <input
        value={neighborhood}
        onChange={e => setNeighborhood(e.target.value)}
        placeholder="e.g. Sersing, Qubahan"
        className="w-full px-3 py-2.5 rounded-[10px] text-[13px] font-[family-name:var(--font-dm-sans)] outline-none mb-3"
        style={inputStyle}
      />

      <label className="block font-[family-name:var(--font-dm-sans)] text-[12px] mb-1.5" style={{ color: c.stone }}>
        Pin your location
      </label>
      <LocationPicker lat={lat} lng={lng} onChange={(la, ln) => { setLat(la); setLng(ln) }} />

      {error && (
        <p className="font-[family-name:var(--font-dm-sans)] text-[12px] mt-2" style={{ color: c.error }}>{error}</p>
      )}

      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="flex-1 py-2.5 rounded-[10px] border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[13px] font-medium transition-all"
          style={{ background: c.green, color: c.white, opacity: isPending ? 0.6 : 1 }}
        >
          {isPending ? 'Saving…' : 'Save address'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-[10px] cursor-pointer font-[family-name:var(--font-dm-sans)] text-[13px]"
            style={{ background: c.white, color: c.stone, border: `1px solid ${c.cream2}` }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
