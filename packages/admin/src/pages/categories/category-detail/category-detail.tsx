import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk"
import {
  LayoutComposer,
  PermissionGuard,
  detailPageDefaultEntries,
  useLinkQuery,
} from "@mercurjs/dashboard-shared"
import { useLoaderData, useParams } from "react-router-dom"

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton"
import { useProductCategory } from "../../../hooks/api/categories"
import { CategoryGeneralSection } from "./components/category-general-section"
import { CategoryIconSection } from "./components/category-icon-section"
import { CategoryMediaSection } from "./components/category-media-section"
import { CategoryOrganizeSection } from "./components/category-organize-section"
import { CategoryProductSection } from "./components/category-product-section"
import { categoryLoader } from "./loader"

export const CategoryDetailPage = () => {
  const { id } = useParams()

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof categoryLoader>
  >

  const linkQuery = useLinkQuery("category")

  const { product_category, isLoading, isError, error } = useProductCategory(
    id!,
    linkQuery,
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

  return (
    <LayoutComposer
      widgetsZonePrefix="categories.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.TWO_COLUMN}
      data={product_category}
      data-testid="category-detail-page"
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="CategoryGeneralSection">
              <CategoryGeneralSection category={product_category} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="CategoryMediaSection">
              <CategoryMediaSection category={product_category} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="CategoryIconSection">
              <CategoryIconSection category={product_category} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="CategoryProductSection">
              <PermissionGuard permission="products:view">
                <CategoryProductSection category={product_category} />
              </PermissionGuard>
            </LayoutComposer.Entry>
            {detailPageDefaultEntries(product_category)}
          </>
        ),
        side: (
          <>
            <LayoutComposer.Entry id="CategoryOrganizeSection">
              <CategoryOrganizeSection category={product_category} />
            </LayoutComposer.Entry>
          </>
        ),
      }}
    />
  )
}
