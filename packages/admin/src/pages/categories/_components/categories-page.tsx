import { ReactNode, createContext, useContext } from "react"
import { SingleColumnPage } from "@components/layout/pages"
import { useExtension } from "@providers/extension-provider"
import { CategoryListTable, CategoryListTableProps } from "./category-list-table"

// Re-export for user customization
export { useCategoryTableColumns } from "./use-category-table-columns"
export type { CategoryListTableProps }

// ============================================
// Context
// ============================================

interface CategoriesPageContextValue {
  // Can be extended with filters, search state, etc.
}

const CategoriesPageContext = createContext<CategoriesPageContextValue | null>(null)

export function useCategoriesPageContext() {
  const context = useContext(CategoriesPageContext)
  if (!context) {
    throw new Error("useCategoriesPageContext must be used within CategoriesPage")
  }
  return context
}

// ============================================
// Components
// ============================================

export interface CategoriesPageProps {
  children?: ReactNode
}

function CategoriesPageRoot({ children }: CategoriesPageProps) {
  const { getWidgets } = useExtension()

  const hasCustomChildren = children !== undefined

  return (
    <CategoriesPageContext.Provider value={{}}>
      <SingleColumnPage
        widgets={{
          after: getWidgets("product_category.list.after"),
          before: getWidgets("product_category.list.before"),
        }}
        hasOutlet
      >
        {hasCustomChildren ? children : <CategoriesPage.Table />}
      </SingleColumnPage>
    </CategoriesPageContext.Provider>
  )
}

function Table(props: CategoryListTableProps) {
  return <CategoryListTable {...props} />
}

// ============================================
// Export Compound Component
// ============================================

export const CategoriesPage = Object.assign(CategoriesPageRoot, {
  Table,
  useContext: useCategoriesPageContext,
})
