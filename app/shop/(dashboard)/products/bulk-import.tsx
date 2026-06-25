'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { bulkImportProducts, type BulkImportResult } from '@/lib/bazaar/shop-actions'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  terra:    '#C4654A',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
} as const

const TEMPLATE = `name_en,name_ku,name_ar,price,unit,stock_qty,category,description
Local Honey,هەنگوین,عسل,8000,jar,12,Groceries,Wild mountain honey
Flatbread,نان,خبز,500,piece,,Bakery,Fresh daily`

export function BulkImport() {
  const [open, setOpen] = useState(false)
  const [csv, setCsv] = useState('')
  const [result, setResult] = useState<BulkImportResult | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bazaar-products-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    file.text().then(setCsv)
  }

  function runImport() {
    if (!csv.trim()) return
    setResult(null)
    startTransition(async () => {
      const res = await bulkImportProducts(csv)
      setResult(res)
      if (res.added > 0) router.refresh()
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[13px] font-medium"
        style={{ background: c.cream, color: c.charcoal }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
        Bulk import
      </button>
    )
  }

  return (
    <div className="rounded-[14px] p-5 mb-4" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-[family-name:var(--font-dm-sans)] text-[15px] font-medium" style={{ color: c.charcoal }}>
          Bulk import products
        </h3>
        <button onClick={() => { setOpen(false); setResult(null); setCsv('') }} className="p-1 border-none bg-transparent cursor-pointer" style={{ color: c.stone }} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>

      <p className="font-[family-name:var(--font-dm-sans)] text-[12px] mb-3" style={{ color: c.stone }}>
        Columns: <span className="font-[family-name:var(--font-dm-mono)]">name_en, price</span> (required), then optional <span className="font-[family-name:var(--font-dm-mono)]">name_ku, name_ar, unit, stock_qty, category, description</span>. Category matches by name.
      </p>

      <div className="flex flex-wrap gap-2 mb-3">
        <button onClick={downloadTemplate} className="px-3 py-1.5 rounded-[8px] border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ background: c.greenBg, color: c.green }}>
          Download template
        </button>
        <button onClick={() => fileRef.current?.click()} className="px-3 py-1.5 rounded-[8px] cursor-pointer font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ background: c.cream, color: c.charcoal, border: 'none' }}>
          Upload CSV file
        </button>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
      </div>

      <textarea
        value={csv}
        onChange={e => setCsv(e.target.value)}
        placeholder="…or paste CSV rows here"
        rows={6}
        className="w-full px-3 py-2 rounded-[10px] text-[12px] font-[family-name:var(--font-dm-mono)] outline-none mb-3"
        style={{ background: c.cream, color: c.charcoal, border: `1px solid ${c.cream2}`, resize: 'vertical' }}
      />

      <button
        onClick={runImport}
        disabled={isPending || !csv.trim()}
        className="px-4 py-2 rounded-[10px] border-none cursor-pointer font-[family-name:var(--font-dm-sans)] text-[13px] font-medium"
        style={{ background: c.green, color: c.white, opacity: (isPending || !csv.trim()) ? 0.6 : 1 }}
      >
        {isPending ? 'Importing…' : 'Import products'}
      </button>

      {result && (
        <div className="mt-4 rounded-[10px] p-3" style={{ background: c.cream }}>
          {result.error ? (
            <p className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.terra }}>{result.error}</p>
          ) : (
            <>
              <p className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ color: c.green }}>
                {result.added} product{result.added !== 1 ? 's' : ''} added
                {result.skipped.length > 0 ? `, ${result.skipped.length} skipped` : ''}
              </p>
              {result.skipped.length > 0 && (
                <ul className="mt-1.5 flex flex-col gap-0.5">
                  {result.skipped.slice(0, 8).map((s, i) => (
                    <li key={i} className="font-[family-name:var(--font-dm-mono)] text-[11px]" style={{ color: c.stone }}>
                      Row {s.row}: {s.reason}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
