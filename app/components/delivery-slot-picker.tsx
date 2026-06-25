'use client'

import { useMemo, useState } from 'react'
import { generateSlotDays } from '@/lib/bazaar/slots'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
} as const

export interface SelectedSlot {
  date: string | null   // null = ASAP
  slot: string | null
}

interface Props {
  onSelect: (s: SelectedSlot) => void
}

export function DeliverySlotPicker({ onSelect }: Props) {
  const days = useMemo(() => generateSlotDays(), [])
  const [mode, setMode] = useState<'asap' | 'schedule'>('asap')
  const [dayIdx, setDayIdx] = useState(0)
  const [slot, setSlot] = useState<string | null>(null)

  function pickAsap() {
    setMode('asap'); setSlot(null); onSelect({ date: null, slot: null })
  }
  function pickSchedule() {
    setMode('schedule')
    // Pre-select the first slot of the first day so a schedule is always valid.
    const first = days[dayIdx]?.slots[0] ?? null
    setSlot(first)
    onSelect({ date: days[dayIdx]?.date ?? null, slot: first })
  }
  function chooseDay(i: number) {
    setDayIdx(i)
    const first = days[i]?.slots[0] ?? null
    setSlot(first)
    onSelect({ date: days[i]?.date ?? null, slot: first })
  }
  function chooseSlot(s: string) {
    setSlot(s)
    onSelect({ date: days[dayIdx]?.date ?? null, slot: s })
  }

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={pickAsap}
          className="flex-1 py-2 rounded-[8px] border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[12px] font-medium transition-colors"
          style={{ background: mode === 'asap' ? c.green : c.white, color: mode === 'asap' ? c.white : c.stone, border: `1px solid ${mode === 'asap' ? c.green : c.cream2}` }}
        >
          As soon as possible
        </button>
        <button
          type="button"
          onClick={pickSchedule}
          disabled={days.length === 0}
          className="flex-1 py-2 rounded-[8px] border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[12px] font-medium transition-colors"
          style={{ background: mode === 'schedule' ? c.green : c.white, color: mode === 'schedule' ? c.white : c.stone, border: `1px solid ${mode === 'schedule' ? c.green : c.cream2}`, opacity: days.length === 0 ? 0.5 : 1 }}
        >
          Schedule
        </button>
      </div>

      {mode === 'schedule' && (
        <div className="rounded-[10px] p-3" style={{ background: c.cream }}>
          <div className="flex gap-1.5 mb-3 overflow-x-auto">
            {days.map((d, i) => (
              <button
                key={d.date}
                type="button"
                onClick={() => chooseDay(i)}
                className="px-3 py-1.5 rounded-[8px] border-none cursor-pointer flex-shrink-0 font-[family-name:var(--font-dm-sans)] text-[12px] transition-colors"
                style={{ background: i === dayIdx ? c.white : 'transparent', color: i === dayIdx ? c.green : c.stone, border: `1px solid ${i === dayIdx ? c.green : c.cream2}` }}
              >
                {d.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {days[dayIdx]?.slots.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => chooseSlot(s)}
                className="py-2 rounded-[8px] border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[12px] transition-colors"
                style={{ background: slot === s ? c.greenBg : c.white, color: slot === s ? c.green : c.charcoal, border: `1px solid ${slot === s ? c.green : c.cream2}` }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
