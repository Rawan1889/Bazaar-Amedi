import type { SupabaseClient } from '@supabase/supabase-js'

type Row = Record<string, unknown> & { id: string }

// Minimal in-memory stand-in for the query shapes adjustCounter uses:
//   from(t).select(c).eq(k, v).single()
//   from(t).update(v).eq(k, v)...eq(k, v).select('id')
// Every call yields to the event loop first, so concurrent callers interleave
// between their read and their write — the situation the CAS guards against.
export function fakeSupabase(tables: Record<string, Row[]>) {
  const db = new Map(Object.entries(tables).map(([t, rows]) => [t, new Map(rows.map(r => [r.id, { ...r }]))]))
  const tick = () => new Promise(r => setTimeout(r, 0))
  const matches = (row: Row, filters: [string, unknown][]) => filters.every(([k, v]) => row[k] === v)

  const client = {
    from(table: string) {
      const rows = db.get(table)!
      return {
        select(cols: string) {
          const filters: [string, unknown][] = []
          const q = {
            eq(k: string, v: unknown) { filters.push([k, v]); return q },
            async single() {
              await tick()
              const row = [...rows.values()].find(r => matches(r, filters))
              if (!row) return { data: null, error: { message: 'not found' } }
              return { data: Object.fromEntries(cols.split(',').map(c => [c.trim(), row[c.trim()]])), error: null }
            },
          }
          return q
        },
        update(values: Record<string, unknown>) {
          const filters: [string, unknown][] = []
          const q = {
            eq(k: string, v: unknown) { filters.push([k, v]); return q },
            async select() {
              await tick()
              const hit = [...rows.values()].filter(r => matches(r, filters))
              for (const r of hit) Object.assign(r, values)
              return { data: hit.map(r => ({ id: r.id })), error: null }
            },
          }
          return q
        },
      }
    },
  }
  return {
    client: client as unknown as SupabaseClient,
    row: (table: string, id: string) => db.get(table)!.get(id)!,
  }
}
