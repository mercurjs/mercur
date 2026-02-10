import { useLoaderData, useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "@components/common/skeleton"
import { SingleColumnPage } from "@components/layout/pages"
import { useDashboardExtension } from "@/extensions"
import { useProductTag } from "@hooks/api"
import { ProductTagGeneralSection } from "./_components/product-tag-general-section"
import { ProductTagProductSection } from "./_components/product-tag-product-section"
import { productTagLoader } from "./loader"

const ProductTagDetail = () => {
  const { id } = useParams()

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof productTagLoader>
  >

  const { getWidgets } = useDashboardExtension()

  const { product_tag, isPending, isError, error } = useProductTag(
    id!,
    undefined,
    {
      initialData,
    }
  )

  if (isPending || !product_tag) {
    return <SingleColumnPageSkeleton showJSON sections={2} />
  }

  if (isError) {
    throw error
  }

  return (
    <SingleColumnPage
      widgets={{
        after: getWidgets("product_tag.details.after"),
        before: getWidgets("product_tag.details.before"),
      }}
      data={product_tag}
    >
      <ProductTagGeneralSection productTag={product_tag} />
      <ProductTagProductSection productTag={product_tag} />
    </SingleColumnPage>
  )
}

export const Component = ProductTagDetail
export { productTagLoader as loader } from "./loader"
export { ProductTagDetailBreadcrumb as Breadcrumb } from "./breadcrumb"
