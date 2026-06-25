// Delivery time-slot generation. Fixed two-hour windows across the next few
// days; today's already-passed windows are filtered out.

export interface SlotDay {
  date: string          // YYYY-MM-DD
  label: string         // "Today", "Tomorrow", "Sat 28 Jun"
  slots: string[]       // ["10:00 – 12:00", ...]
}

const WINDOWS: [number, number][] = [
  [10, 12], [12, 14], [14, 16], [16, 18], [18, 20],
]
const DAYS_AHEAD = 3
// Orders need ~1h lead time, so hide a window if it starts within the next hour.
const LEAD_HOURS = 1

function fmtWindow([start, end]: [number, number]): string {
  const p = (h: number) => `${String(h).padStart(2, '0')}:00`
  return `${p(start)} – ${p(end)}`
}

export function generateSlotDays(now: Date = new Date()): SlotDay[] {
  const days: SlotDay[] = []

  for (let i = 0; i < DAYS_AHEAD; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    const isToday = i === 0
    const cutoff = now.getHours() + LEAD_HOURS

    const slots = WINDOWS
      .filter(w => !isToday || w[0] >= cutoff)
      .map(fmtWindow)

    if (slots.length === 0) continue

    const label = i === 0 ? 'Today'
      : i === 1 ? 'Tomorrow'
      : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

    days.push({ date: dateStr, label, slots })
  }

  return days
}
