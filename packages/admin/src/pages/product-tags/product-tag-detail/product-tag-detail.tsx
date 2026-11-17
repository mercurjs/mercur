import { useLoaderData, useParams } from "react-router-dom"

import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk"
import {
  LayoutComposer,
  PermissionGuard,
  detailPageDefaultEntries,
} from "@mercurjs/dashboard-shared"
import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { useProductTag } from "../../../hooks/api"

import { ProductTagGeneralSection } from "./components/product-tag-general-section"
import { ProductTagProductSection } from "./components/product-tag-product-section"
import { productTagLoader } from "./loader"

export const ProductTagDetailPage = () => {
  const { id } = useParams()

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof productTagLoader>
  >

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
    <LayoutComposer
      widgetsZonePrefix="product-tags.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.SINGLE_COLUMN}
      data={product_tag}
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="ProductTagGeneralSection">
              <ProductTagGeneralSection productTag={product_tag} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="ProductTagProductSection">
              <PermissionGuard permission="products:view">
                <ProductTagProductSection productTag={product_tag} />
              </PermissionGuard>
            </LayoutComposer.Entry>
            {detailPageDefaultEntries(product_tag)}
          </>
        ),
      }}
    />
  )
}
