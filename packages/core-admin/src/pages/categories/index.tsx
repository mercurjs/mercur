// Route: /categories

import { CategoriesPage } from "./_components/categories-page"

export const nav = {
  id: "categories",
  labelKey: "navigation.items.categories",
  parent: "products",
  order: 20,
}

// Re-export compound component and types for user overrides
export { CategoriesPage }
export type { CategoriesPageProps } from "./_components/categories-page"

// Re-export hooks for extending tables
export { useCategoryTableColumns } from "./_components/use-category-table-columns"

// Main component - uses compound component with default layout
// Users can override this file to customize the layout
export const Component = () => {
  return (
    <CategoriesPage>
      <CategoriesPage.Table />
    </CategoriesPage>
  )
}
