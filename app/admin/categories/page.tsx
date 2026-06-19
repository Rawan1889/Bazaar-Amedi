import { getAllCategories } from '@/lib/bazaar/admin-actions'
import { CategoryManager } from './category-manager'

export default async function AdminCategoriesPage() {
  const categories = await getAllCategories()

  return (
    <div>
      <h1 className="font-[family-name:var(--font-dm-sans)] text-[28px] font-medium mb-1" style={{ color: '#1E1C19' }}>
        Categories
      </h1>
      <p className="font-[family-name:var(--font-dm-sans)] text-[14px] mb-8" style={{ color: '#7A756E' }}>
        Manage product categories for the marketplace.
      </p>

      <CategoryManager categories={categories} />
    </div>
  )
}
