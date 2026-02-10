// Route: /categories/:id
import { HttpTypes } from "@medusajs/types"
import { UIMatch, useParams, LoaderFunctionArgs } from "react-router-dom"

import { TwoColumnPageSkeleton } from "@components/common/skeleton"
import { TwoColumnPage } from "@components/layout/pages"
import { useDashboardExtension } from "@/extensions"
import { useProductCategory } from "@hooks/api"
import { categoriesQueryKeys } from "@hooks/api/categories"
import { fetchQuery } from "@lib/client"
import { queryClient } from "@lib/query-client"

import { CategoryGeneralSection } from "./_components/category-general-section"
import { CategoryOrganizeSection } from "./_components/category-organize-section"
import { CategoryProductSection } from "./_components/category-product-section"

// Loader
const categoryDetailQuery = (id: string) => ({
  queryKey: categoriesQueryKeys.detail(id),
  queryFn: async () =>
    fetchQuery(`/vendor/product-categories/${id}`, {
      method: "GET",
    }),
})

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = categoryDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}

// Breadcrumb
type CategoryDetailBreadcrumbProps = UIMatch<HttpTypes.AdminProductCategoryResponse>

export const Breadcrumb = (props: CategoryDetailBreadcrumbProps) => {
  const { id } = props.params || {}

  const { product_category } = useProductCategory(
    id!,
    { fields: "name" },
    { initialData: props.data, enabled: Boolean(id) }
  )

  if (!product_category) {
    return null
  }

  return <span>{product_category.name}</span>
}

// Main component
export const Component = () => {
  const { id } = useParams()
  const { getWidgets } = useDashboardExtension()

  const {
    product_category,
    isLoading: categoryLoading,
    isError: categoryError,
    error,
  } = useProductCategory(id!, {
    fields: "+is_active,+is_internal",
  })

  if (categoryLoading || !product_category) {
    return (
      <TwoColumnPageSkeleton
        mainSections={2}
        sidebarSections={1}
        showJSON
        showMetadata
      />
    )
  }

  if (categoryError) {
    throw error
  }

  return (
    <TwoColumnPage
      widgets={{
        after: getWidgets("product_category.details.after"),
        before: getWidgets("product_category.details.before"),
        sideAfter: getWidgets("product_category.details.side.after"),
        sideBefore: getWidgets("product_category.details.side.before"),
      }}
      data={product_category}
    >
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
