import { ReactNode, createContext, useContext } from "react"
import { HttpTypes } from "@medusajs/types"

import { TwoColumnPage } from "@components/layout/pages"
import { TwoColumnPageSkeleton } from "@components/common/skeleton"
import { useExtension } from "@providers/extension-provider"

import { CategoryGeneralSection } from "./sections/category-general-section"
import { CategoryOrganizeSection } from "./sections/category-organize-section"
import { CategoryProductSection } from "./sections/category-product-section"

// ============================================
// Context
// ============================================

interface CategoryDetailContextValue {
  category: HttpTypes.AdminProductCategory
}

const CategoryDetailContext = createContext<CategoryDetailContextValue | null>(null)

export function useCategoryDetailContext() {
  const context = useContext(CategoryDetailContext)
  if (!context) {
    throw new Error("useCategoryDetailContext must be used within CategoryDetailPage")
  }
  return context
}

// ============================================
// Components
// ============================================

export interface CategoryDetailPageProps {
  children?: ReactNode
  category: HttpTypes.AdminProductCategory
}

function CategoryDetailPageRoot({ children, category }: CategoryDetailPageProps) {
  const { getWidgets } = useExtension()

  const hasCustomChildren = children !== undefined

  return (
    <CategoryDetailContext.Provider value={{ category }}>
      <TwoColumnPage
        widgets={{
          after: getWidgets("product_category.details.after"),
          before: getWidgets("product_category.details.before"),
          sideAfter: getWidgets("product_category.details.side.after"),
          sideBefore: getWidgets("product_category.details.side.before"),
        }}
        showJSON
        showMetadata
        data={category}
      >
        {hasCustomChildren ? (
          children
        ) : (
          <>
            <CategoryDetailPage.Main>
              <CategoryDetailPage.GeneralSection />
              <CategoryDetailPage.ProductSection />
            </CategoryDetailPage.Main>
            <CategoryDetailPage.Sidebar>
              <CategoryDetailPage.OrganizeSection />
            </CategoryDetailPage.Sidebar>
          </>
        )}
      </TwoColumnPage>
    </CategoryDetailContext.Provider>
  )
}

function Main({ children }: { children: ReactNode }) {
  return <TwoColumnPage.Main>{children}</TwoColumnPage.Main>
}

function Sidebar({ children }: { children: ReactNode }) {
  return <TwoColumnPage.Sidebar>{children}</TwoColumnPage.Sidebar>
}

function GeneralSection() {
  const { category } = useCategoryDetailContext()
  return <CategoryGeneralSection category={category} />
}

function ProductSection() {
  const { category } = useCategoryDetailContext()
  return <CategoryProductSection category={category} />
}

function OrganizeSection() {
  const { category } = useCategoryDetailContext()
  return <CategoryOrganizeSection category={category} />
}

function Skeleton() {
  return (
    <TwoColumnPageSkeleton
      mainSections={2}
      sidebarSections={1}
      showJSON
      showMetadata
    />
  )
}

// ============================================
// Export Compound Component
// ============================================

export const CategoryDetailPage = Object.assign(CategoryDetailPageRoot, {
  Main,
  Sidebar,
  GeneralSection,
  ProductSection,
  OrganizeSection,
  Skeleton,
  useContext: useCategoryDetailContext,
})
