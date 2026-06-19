'use client'

import { useState, useTransition } from 'react'
import { addCategory, deleteCategory } from '@/lib/bazaar/admin-actions'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  terra:    '#C4654A',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
  error:    '#C94A3A',
  errorBg:  'rgba(201,74,58,0.08)',
} as const

interface Category {
  id: string
  name_en: string
  name_ku: string | null
  name_ar: string | null
  slug: string
  sort_order: number
}

function CategoryRow({ cat }: { cat: Category }) {
  const [isPending, startTransition] = useTransition()

  return (
    <div
      className="flex items-center justify-between px-5 py-4"
      style={{ borderBottom: `1px solid ${c.cream2}`, opacity: isPending ? 0.5 : 1 }}
    >
      <div>
        <div className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: c.charcoal }}>
          {cat.name_en}
        </div>
        <div className="flex gap-3 mt-0.5">
          {cat.name_ku && (
            <span className="font-[family-name:var(--font-dm-sans)] text-[11px]" style={{ color: c.stone }}>
              KU: {cat.name_ku}
            </span>
          )}
          {cat.name_ar && (
            <span className="font-[family-name:var(--font-dm-sans)] text-[11px]" style={{ color: c.stone }}>
              AR: {cat.name_ar}
            </span>
          )}
          <span className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>
            /{cat.slug}
          </span>
        </div>
      </div>
      <button
        onClick={() => {
          if (confirm(`Delete category "${cat.name_en}"?`)) {
            startTransition(() => { deleteCategory(cat.id) })
          }
        }}
        className="px-2 py-1.5 rounded-[6px] font-[family-name:var(--font-dm-sans)] text-[10px] border-none cursor-pointer bg-transparent"
        style={{ color: c.stone }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <div>
      {showForm ? (
        <div className="rounded-[14px] p-5 mb-6" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-[family-name:var(--font-dm-sans)] text-[16px] font-medium" style={{ color: c.charcoal }}>
              New category
            </h3>
            <button
              onClick={() => { setShowForm(false); setError(null) }}
              className="text-[12px] font-[family-name:var(--font-dm-sans)] border-none bg-transparent cursor-pointer"
              style={{ color: c.stone }}
            >
              Cancel
            </button>
          </div>

          {error && (
            <div className="rounded-[8px] px-3 py-2 mb-4 text-[12px] font-[family-name:var(--font-dm-sans)]" style={{ background: c.errorBg, color: c.error }}>
              {error}
            </div>
          )}

          <form
            className="flex flex-col gap-4"
            action={(formData: FormData) => {
              setError(null)
              startTransition(async () => {
                const result = await addCategory(formData)
                if (result?.error) setError(result.error)
                else setShowForm(false)
              })
            }}
          >
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
                  English name
                </label>
                <input
                  name="name_en"
                  required
                  placeholder="e.g. Dairy"
                  className="w-full rounded-[8px] px-3 py-2.5 text-[13px] font-[family-name:var(--font-dm-sans)] outline-none"
                  style={{ border: `1px solid ${c.cream2}`, color: c.charcoal }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
                  Kurdish name
                </label>
                <input
                  name="name_ku"
                  placeholder="e.g. شیر و پەنیر"
                  className="w-full rounded-[8px] px-3 py-2.5 text-[13px] font-[family-name:var(--font-dm-sans)] outline-none"
                  style={{ border: `1px solid ${c.cream2}`, color: c.charcoal }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase" style={{ color: c.stone }}>
                  Arabic name
                </label>
                <input
                  name="name_ar"
                  placeholder="e.g. ألبان"
                  className="w-full rounded-[8px] px-3 py-2.5 text-[13px] font-[family-name:var(--font-dm-sans)] outline-none"
                  style={{ border: `1px solid ${c.cream2}`, color: c.charcoal }}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2 rounded-[8px] font-[family-name:var(--font-dm-sans)] text-[13px] font-medium border-none cursor-pointer"
                style={{ background: c.green, color: '#fff', opacity: isPending ? 0.7 : 1 }}
              >
                {isPending ? 'Adding...' : 'Add category'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="mb-6 px-5 py-2.5 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[13px] font-medium border-none cursor-pointer"
          style={{ background: c.green, color: '#fff' }}
        >
          + Add category
        </button>
      )}

      <div className="rounded-[14px] overflow-hidden" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
        {categories.map(cat => (
          <CategoryRow key={cat.id} cat={cat as Category} />
        ))}
        {categories.length === 0 && (
          <div className="p-8 text-center">
            <p className="font-[family-name:var(--font-dm-sans)] text-[14px]" style={{ color: c.stone }}>
              No categories yet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
