'use client'

import { useEffect, useState, useCallback } from 'react'
import { getAddresses, type Address } from '@/lib/bazaar/address-actions'
import { getActiveZones } from '@/lib/bazaar/zone-actions'
import type { DeliveryZone } from '@/lib/bazaar/zone-utils'
import { AddressForm } from './address-form'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
} as const

export interface SelectedAddress {
  id: string
  text: string
  lat: number | null
  lng: number | null
  zone: DeliveryZone | null
}

interface Props {
  onSelect: (a: SelectedAddress | null) => void
}

export function CheckoutAddress({ onSelect }: Props) {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(true)

  const reportSelection = useCallback((list: Address[], zoneList: DeliveryZone[], id: string | null) => {
    const a = list.find(x => x.id === id)
    if (!a) { onSelect(null); return }
    const zone = zoneList.find(z => z.id === a.zone_id) || null
    onSelect({
      id: a.id,
      text: `${a.label} — ${a.address_text}${a.neighborhood ? `, ${a.neighborhood}` : ''}`,
      lat: a.lat, lng: a.lng, zone,
    })
  }, [onSelect])

  const load = useCallback(async (preferId?: string) => {
    const [list, zoneList] = await Promise.all([getAddresses(), getActiveZones()])
    setAddresses(list)
    setZones(zoneList)
    setLoading(false)
    const pick = preferId || list.find(a => a.is_default)?.id || list[0]?.id || null
    setSelectedId(pick)
    reportSelection(list, zoneList, pick)
    setAdding(list.length === 0)
  }, [reportSelection])

  useEffect(() => { load() }, [load])

  function choose(id: string) {
    setSelectedId(id)
    reportSelection(addresses, zones, id)
  }

  if (loading) {
    return (
      <div className="h-12 rounded-[8px] animate-pulse" style={{ background: c.cream }} />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {addresses.map(a => {
        const active = a.id === selectedId
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => choose(a.id)}
            className="flex items-start gap-3 text-left rounded-[10px] p-3 border-none cursor-pointer transition-colors"
            style={{ background: active ? c.greenBg : c.white, border: `1px solid ${active ? c.green : c.cream2}` }}
          >
            <div
              className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center"
              style={{ border: `2px solid ${active ? c.green : c.cream2}` }}
            >
              {active && <div className="w-2 h-2 rounded-full" style={{ background: c.green }} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ color: c.charcoal }}>
                  {a.label}
                </span>
                {a.lat != null && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={c.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                )}
              </div>
              <div className="font-[family-name:var(--font-dm-sans)] text-[12px] mt-0.5 truncate" style={{ color: c.stone }}>
                {a.address_text}{a.neighborhood ? ` · ${a.neighborhood}` : ''}
              </div>
            </div>
          </button>
        )
      })}

      {adding ? (
        <AddressForm
          onSaved={(id) => { setAdding(false); load(id) }}
          onCancel={addresses.length > 0 ? () => setAdding(false) : undefined}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] border-none cursor-pointer self-start font-[family-name:var(--font-dm-sans)] text-[12px] font-medium"
          style={{ background: c.cream, color: c.green }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add a new address
        </button>
      )}
    </div>
  )
}
