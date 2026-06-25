'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createZone, updateZone, toggleZone, deleteZone } from '@/lib/bazaar/zone-actions'
import type { DeliveryZone } from '@/lib/bazaar/zone-utils'

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

const fmt = (n: number) => new Intl.NumberFormat('en-IQ').format(n) + ' IQD'

function ZoneRow({ zone }: { zone: DeliveryZone }) {
  const [editing, setEditing] = useState(false)
  const [, startTransition] = useTransition()
  const router = useRouter()

  if (editing) {
    return <ZoneForm zone={zone} onDone={() => { setEditing(false); router.refresh() }} onCancel={() => setEditing(false)} />
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-[12px] p-4" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: c.charcoal }}>{zone.name}</span>
          {!zone.is_active && (
            <span className="font-[family-name:var(--font-dm-mono)] text-[9px] uppercase px-1.5 py-0.5 rounded-[4px]" style={{ background: c.cream, color: c.stone }}>Hidden</span>
          )}
        </div>
        <div className="font-[family-name:var(--font-dm-sans)] text-[12px] mt-0.5" style={{ color: c.stone }}>
          Fee {fmt(zone.fee)}
          {zone.min_order > 0 && ` · Min ${fmt(zone.min_order)}`}
          {zone.free_delivery_threshold != null && ` · Free over ${fmt(zone.free_delivery_threshold)}`}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={() => setEditing(true)} className="px-2.5 py-1 rounded-[6px] border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ background: c.cream, color: c.charcoal }}>
          Edit
        </button>
        <button
          onClick={() => startTransition(async () => { await toggleZone(zone.id, !zone.is_active); router.refresh() })}
          className="px-2.5 py-1 rounded-[6px] border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[12px]"
          style={{ background: c.cream, color: zone.is_active ? c.stone : c.green }}
        >
          {zone.is_active ? 'Hide' : 'Show'}
        </button>
        <button
          onClick={() => { if (confirm(`Delete zone "${zone.name}"?`)) startTransition(async () => { await deleteZone(zone.id); router.refresh() }) }}
          className="p-1.5 rounded-[6px] border-none cursor-pointer" style={{ background: 'transparent', color: c.stone }} aria-label="Delete zone"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function ZoneForm({ zone, onDone, onCancel }: { zone?: DeliveryZone; onDone: () => void; onCancel?: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = zone ? await updateZone(zone.id, formData) : await createZone(formData)
      if (res.error) setError(res.error)
      else onDone()
    })
  }

  const inputStyle = { background: c.white, color: c.charcoal, border: `1px solid ${c.cream2}` } as const
  const labelStyle = 'block font-[family-name:var(--font-dm-sans)] text-[11px] mb-1'

  return (
    <form action={submit} className="rounded-[12px] p-4" style={{ background: c.cream, border: `1px solid ${c.cream2}` }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className={labelStyle} style={{ color: c.stone }}>Zone name</label>
          <input name="name" defaultValue={zone?.name} placeholder="e.g. Sersing, Qubahan" className="w-full px-3 py-2 rounded-[8px] text-[13px] font-[family-name:var(--font-dm-sans)] outline-none" style={inputStyle} />
        </div>
        <div>
          <label className={labelStyle} style={{ color: c.stone }}>Delivery fee (IQD)</label>
          <input name="fee" type="number" defaultValue={zone?.fee ?? 2500} className="w-full px-3 py-2 rounded-[8px] text-[13px] font-[family-name:var(--font-dm-sans)] outline-none" style={inputStyle} />
        </div>
        <div>
          <label className={labelStyle} style={{ color: c.stone }}>Minimum order (IQD)</label>
          <input name="min_order" type="number" defaultValue={zone?.min_order ?? 0} className="w-full px-3 py-2 rounded-[8px] text-[13px] font-[family-name:var(--font-dm-sans)] outline-none" style={inputStyle} />
        </div>
        <div className="md:col-span-2">
          <label className={labelStyle} style={{ color: c.stone }}>Free delivery over (IQD) — leave blank for none</label>
          <input name="free_delivery_threshold" type="number" defaultValue={zone?.free_delivery_threshold ?? ''} className="w-full px-3 py-2 rounded-[8px] text-[13px] font-[family-name:var(--font-dm-sans)] outline-none" style={inputStyle} />
        </div>
      </div>
      {error && <p className="font-[family-name:var(--font-dm-sans)] text-[12px] mt-2" style={{ color: c.error }}>{error}</p>}
      <div className="flex gap-2 mt-3">
        <button type="submit" disabled={isPending} className="px-4 py-2 rounded-[8px] border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ background: c.green, color: c.white, opacity: isPending ? 0.6 : 1 }}>
          {isPending ? 'Saving…' : zone ? 'Save changes' : 'Add zone'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-[8px] cursor-pointer font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ background: c.white, color: c.stone, border: `1px solid ${c.cream2}` }}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export function ZoneManager({ zones }: { zones: DeliveryZone[] }) {
  const [adding, setAdding] = useState(false)
  const router = useRouter()

  return (
    <div>
      <div className="flex flex-col gap-2 mb-4">
        {zones.map(z => <ZoneRow key={z.id} zone={z} />)}
      </div>

      {adding ? (
        <ZoneForm onDone={() => { setAdding(false); router.refresh() }} onCancel={() => setAdding(false)} />
      ) : (
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ background: c.greenBg, color: c.green }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add a zone
        </button>
      )}
    </div>
  )
}
