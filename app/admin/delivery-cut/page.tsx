export const dynamic = 'force-dynamic'
import Link from 'next/link'
import type { Route } from 'next'
import { getDeliveryCutReport, type DeliveryPeriod } from '@/lib/bazaar/delivery-report-actions'
import { KELA_DELIVERY_CUT_PERCENT, type CutLine } from '@/lib/bazaar/delivery-cut'

const c = {
  green:    '#287A53',
  greenBg:  'rgba(45,138,94,0.08)',
  terra:    '#A8563F',
  charcoal: '#1E1C19',
  stone:    '#716C66',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
} as const

const fmt = (n: number) => new Intl.NumberFormat('en-IQ').format(n)

const PERIODS: { key: DeliveryPeriod; label: string }[] = [
  { key: 'this-month', label: 'This month' },
  { key: 'last-month', label: 'Last month' },
  { key: 'all', label: 'All time' },
]

function Figures({ line, shareLabel }: { line: CutLine; shareLabel: string }) {
  const cells = [
    { label: 'Deliveries', value: fmt(line.deliveries), color: c.charcoal },
    { label: 'Delivery fees', value: fmt(line.fees), color: c.charcoal },
    { label: `Kela ${KELA_DELIVERY_CUT_PERCENT}%`, value: fmt(line.kela), color: c.green },
    { label: shareLabel, value: fmt(line.share), color: c.charcoal },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
      {cells.map(cell => (
        <div key={cell.label} className="min-w-0">
          <div className="font-[family-name:var(--font-dm-mono)] text-[9px] tracking-[0.1em] uppercase truncate" style={{ color: c.stone }}>
            {cell.label}
          </div>
          <div className="font-[family-name:var(--font-dm-sans)] text-[15px] font-medium tabular-nums" style={{ color: cell.color }}>
            {cell.value}
          </div>
        </div>
      ))}
    </div>
  )
}

function Person({ line }: { line: CutLine }) {
  return (
    <div className="min-w-0">
      <div className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium truncate" style={{ color: c.charcoal }}>{line.name}</div>
      {line.phone && (
        <div className="font-[family-name:var(--font-dm-mono)] text-[11px]" style={{ color: c.stone }} dir="ltr">{line.phone}</div>
      )}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-[family-name:var(--font-dm-mono)] text-[11px] tracking-[0.1em] uppercase mb-3 mt-8" style={{ color: c.stone }}>
      {children}
    </h2>
  )
}

export default async function DeliveryCutPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period: raw } = await searchParams
  const period: DeliveryPeriod = PERIODS.some(p => p.key === raw) ? (raw as DeliveryPeriod) : 'this-month'
  const report = await getDeliveryCutReport(period)
  if (!report) return null
  const { totals } = report

  return (
    <div>
      <h1 className="font-[family-name:var(--font-dm-sans)] text-[24px] font-medium mb-1" style={{ color: c.charcoal }}>
        Delivery cut
      </h1>
      <p className="font-[family-name:var(--font-dm-sans)] text-[14px] mb-6 max-w-[65ch]" style={{ color: c.stone }}>
        {`Kela takes ${KELA_DELIVERY_CUT_PERCENT}% of each delivery fee — not of the order price. Counts delivered orders only; pickup orders are not included. Amounts in IQD.`}
      </p>

      <div className="flex gap-1 p-1 rounded-[10px] mb-6 w-fit" style={{ background: c.cream }}>
        {PERIODS.map(p => (
          <Link
            key={p.key}
            href={`/admin/delivery-cut?period=${p.key}` as Route}
            className="px-3 py-1.5 rounded-[8px] no-underline font-[family-name:var(--font-dm-sans)] text-[13px]"
            style={{
              background: period === p.key ? c.white : 'transparent',
              color: period === p.key ? c.charcoal : c.stone,
              fontWeight: period === p.key ? 500 : 400,
            }}
          >
            {p.label}
          </Link>
        ))}
      </div>

      <div className="rounded-[14px] p-5" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Deliveries', value: fmt(totals.deliveries), color: c.charcoal },
            { label: 'Delivery fees', value: fmt(totals.fees), color: c.charcoal },
            { label: `Kela cut ${KELA_DELIVERY_CUT_PERCENT}%`, value: fmt(totals.kela), color: c.green },
            { label: 'Drivers & companies', value: fmt(totals.share), color: c.charcoal },
          ].map(s => (
            <div key={s.label} className="min-w-0">
              <div className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase mb-1.5" style={{ color: c.stone }}>
                {s.label}
              </div>
              <div className="font-[family-name:var(--font-dm-sans)] text-[24px] font-medium tabular-nums" style={{ color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {totals.deliveries === 0 && (
        <div className="rounded-[14px] p-8 text-center mt-6" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
          <p className="font-[family-name:var(--font-dm-sans)] text-[14px]" style={{ color: c.stone }}>
            No delivered orders in this period.
          </p>
        </div>
      )}

      {report.fleets.length > 0 && (
        <>
          <SectionTitle>Delivery companies</SectionTitle>
          <div className="flex flex-col gap-3">
            {report.fleets.map(f => (
              <div key={f.id} className="rounded-[14px] p-4" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                  <div className="md:w-[200px] flex-shrink-0"><Person line={f} /></div>
                  <div className="flex-1"><Figures line={f} shareLabel={`Company ${100 - KELA_DELIVERY_CUT_PERCENT}%`} /></div>
                </div>
                {f.drivers.length > 0 && (
                  <div className="mt-3 pt-3 flex flex-col gap-2" style={{ borderTop: `1px solid ${c.cream}` }}>
                    {f.drivers.map(d => (
                      <div key={d.id} className="flex items-center justify-between gap-3 font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ color: c.stone }}>
                        <span className="truncate">{d.name}</span>
                        <span className="tabular-nums flex-shrink-0">
                          {fmt(d.deliveries)} <span>{d.deliveries === 1 ? 'delivery' : 'deliveries'}</span> · {fmt(d.fees)} IQD
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {report.drivers.length > 0 && (
        <>
          <SectionTitle>Independent drivers</SectionTitle>
          <div className="flex flex-col gap-3">
            {report.drivers.map(d => (
              <div key={d.id} className="rounded-[14px] p-4" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                  <div className="md:w-[200px] flex-shrink-0"><Person line={d} /></div>
                  <div className="flex-1"><Figures line={d} shareLabel={`Driver ${100 - KELA_DELIVERY_CUT_PERCENT}%`} /></div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
