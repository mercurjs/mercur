// Route: /categories/:id

import { HttpTypes } from "@medusajs/types"
import { LoaderFunctionArgs, UIMatch, useLoaderData, useParams } from "react-router-dom"

import { useProductCategory, categoriesQueryKeys } from "@hooks/api/categories"
import { sdk } from "@lib/client"
import { queryClient } from "@lib/query-client"

import { CategoryDetailPage } from "./_components/category-detail-page"

// Re-export compound component and types for user overrides
export { CategoryDetailPage }
export type { CategoryDetailPageProps } from "./_components/category-detail-page"

// ============================================
// Loader
// ============================================

const categoryDetailQuery = (id: string) => ({
  queryKey: categoriesQueryKeys.detail(id),
  queryFn: async () => sdk.admin.productCategory.retrieve(id),
})

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = categoryDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}

// ============================================
// Breadcrumb
// ============================================

type CategoryDetailBreadcrumbProps =
  UIMatch<HttpTypes.AdminProductCategoryResponse>

export const Breadcrumb = (props: CategoryDetailBreadcrumbProps) => {
  const { id } = props.params || {}

  const { product_category } = useProductCategory(
    id!,
    {
      fields: "name",
    },
    {
      initialData: props.data,
      enabled: Boolean(id),
    }
  )

  if (!product_category) {
    return null
  }

  return <span>{product_category.name}</span>
}

// ============================================
// Component
// ============================================

export const Component = () => {
  const { id } = useParams()

  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>

  const { product_category, isLoading, isError, error } = useProductCategory(
    id!,
    undefined,
    {
      initialData,
    }
  )

  if (isLoading || !product_category) {
    return <CategoryDetailPage.Skeleton />
  }

  if (isError) {
    throw error
  }

  return (
    <CategoryDetailPage category={product_category}>
      <CategoryDetailPage.Main>
        <CategoryDetailPage.GeneralSection />
        <CategoryDetailPage.ProductSection />
      </CategoryDetailPage.Main>
      <CategoryDetailPage.Sidebar>
        <CategoryDetailPage.OrganizeSection />
      </CategoryDetailPage.Sidebar>
    </CategoryDetailPage>
  )
}
