'use client'

const c = {
  green:  '#2D8A5E',
  stone:  '#7A756E',
  cream2: '#E8E4DE',
  white:  '#FFFFFF',
} as const

type Category = { id: string; slug: string; name_en: string }

export function CategoryFilter({
  categories,
  activeCategory,
}: {
  categories: Category[]
  activeCategory: string | null
}) {
  return (
    <div className="relative flex-shrink-0">
      <select
        value={activeCategory ?? ''}
        onChange={(e) => {
          const v = e.target.value
          window.location.href = v ? `/browse?category=${v}` : '/browse'
        }}
        className="appearance-none pl-4 pr-9 py-3 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[13px] cursor-pointer outline-none"
        style={{
          background: activeCategory ? c.green : c.white,
          color: activeCategory ? '#fff' : c.stone,
          border: `1px solid ${activeCategory ? c.green : c.cream2}`,
          minWidth: 130,
        }}
      >
        <option value="">All categories</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.slug}>{cat.name_en}</option>
        ))}
      </select>
      <svg
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        width="12" height="12" viewBox="0 0 12 12" fill="none"
      >
        <path d="M2 4l4 4 4-4" stroke={activeCategory ? '#fff' : c.stone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}
