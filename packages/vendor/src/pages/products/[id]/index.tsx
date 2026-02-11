// Route: /products/:id
import { UIMatch } from "react-router-dom"
import { LoaderFunctionArgs } from "react-router-dom"

import { useProduct } from "@hooks/api"
import { productsQueryKeys } from "@hooks/api/products"
import { fetchQuery } from "@lib/client"
import { queryClient } from "@lib/query-client"
import { ExtendedAdminProductResponse } from "@custom-types/products"

import { ProductDetailPage } from "./product-detail-page"
import { PRODUCT_DETAIL_FIELDS } from "./constants"

// Loader
const productDetailQuery = (id: string) => ({
  queryKey: productsQueryKeys.detail(id, {
    fields: PRODUCT_DETAIL_FIELDS,
  }),
  queryFn: async () =>
    fetchQuery(`/vendor/products/${id}`, {
      method: "GET",
      query: {
        fields: PRODUCT_DETAIL_FIELDS,
      },
    }),
})

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = productDetailQuery(id!)

  const response = await queryClient.ensureQueryData({
    ...query,
    staleTime: 90000,
  })

  return response
}

// Breadcrumb
type ProductDetailBreadcrumbProps = UIMatch<ExtendedAdminProductResponse>

export const Breadcrumb = (props: ProductDetailBreadcrumbProps) => {
  const { id } = props.params || {}

  const { product } = useProduct(
    id!,
    {
      fields: PRODUCT_DETAIL_FIELDS,
    },
    {
      enabled: Boolean(id),
    }
  )

  if (!product) {
    return null
  }

  return <span>{product?.title}</span>
}

// Main component
export const Component = () => {
  return <ProductDetailPage />
}
