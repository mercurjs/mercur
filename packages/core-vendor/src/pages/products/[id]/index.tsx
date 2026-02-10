// Route: /products/:id
import { UIMatch } from "react-router-dom"
import { useParams, LoaderFunctionArgs } from "react-router-dom"

import { TwoColumnPageSkeleton } from "@components/common/skeleton"
import { TwoColumnPage } from "@components/layout/pages"
import { useProduct } from "@hooks/api"
import { productsQueryKeys } from "@hooks/api/products"
import { fetchQuery } from "@lib/client"
import { queryClient } from "@lib/query-client"
import { useDashboardExtension } from "@/extensions"
import { ExtendedAdminProductResponse } from "@custom-types/products"

import { ProductGeneralSection } from "./_components/product-general-section"
import { ProductMediaSection } from "./_components/product-media-section"
import { ProductOptionSection } from "./_components/product-option-section"
import { ProductOrganizationSection } from "./_components/product-organization-section"
import { ProductVariantSection } from "./_components/product-variant-section"
import { ProductAdditionalAttributesSection } from "./_components/product-additional-attribute-section/ProductAdditionalAttributesSection"
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
        fields:
          "*variants.inventory_items,*categories,attribute_values.*,attribute_values.attribute.*",
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
  const { id } = useParams()
  const { product, isLoading, isError, error } = useProduct(id!, {
    fields:
      "*categories,attribute_values.*,attribute_values.attribute.*,*options",
  })

  const { getWidgets } = useDashboardExtension()

  const after = getWidgets("product.details.after")
  const before = getWidgets("product.details.before")
  const sideAfter = getWidgets("product.details.side.after")
  const sideBefore = getWidgets("product.details.side.before")

  if (isLoading || !product) {
    return <TwoColumnPageSkeleton mainSections={4} sidebarSections={3} />
  }

  if (isError) {
    throw error
  }

  return (
    <TwoColumnPage
      widgets={{
        after,
        before,
        sideAfter,
        sideBefore,
      }}
      data={product}
    >
      <TwoColumnPage.Main>
        <ProductGeneralSection product={product} />
        <ProductMediaSection product={product} />
        <ProductOptionSection product={product} />
        <ProductVariantSection product={product} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <ProductOrganizationSection product={product} />
        <ProductAdditionalAttributesSection product={product} />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}
