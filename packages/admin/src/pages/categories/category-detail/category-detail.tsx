import { ReactNode, Children } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton"
import { TwoColumnPage } from "../../../components/layout/pages"
import { useProductCategory } from "../../../hooks/api/categories"
import { CategoryGeneralSection } from "./components/category-general-section"
import { CategoryOrganizeSection } from "./components/category-organize-section"
import { CategoryProductSection } from "./components/category-product-section"
import { categoryLoader } from "./loader"

const Root = ({ children }: { children?: ReactNode }) => {
  const { id } = useParams()

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof categoryLoader>
  >

  const { product_category, isLoading, isError, error } = useProductCategory(
    id!,
    undefined,
    {
      initialData,
    }
  )

  if (isLoading || !product_category) {
    return (
      <TwoColumnPageSkeleton
        mainSections={2}
        sidebarSections={1}
        showJSON
        showMetadata
      />
    )
  }

  if (isError) {
    throw error
  }

  return Children.count(children) > 0 ? (
    <TwoColumnPage showJSON showMetadata data={product_category} data-testid="category-detail-page">
      {children}
    </TwoColumnPage>
  ) : (
    <TwoColumnPage showJSON showMetadata data={product_category} data-testid="category-detail-page">
      <TwoColumnPage.Main>
        <CategoryGeneralSection category={product_category} />
        <CategoryProductSection category={product_category} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <CategoryOrganizeSection category={product_category} />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}

export const CategoryDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: CategoryGeneralSection,
  MainProductSection: CategoryProductSection,
  SidebarOrganizeSection: CategoryOrganizeSection,
})
