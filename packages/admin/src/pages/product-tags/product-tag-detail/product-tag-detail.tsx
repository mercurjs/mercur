import { ReactNode } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { SingleColumnPage } from "../../../components/layout/pages"
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition"
import { useProductTag } from "../../../hooks/api"

import { ProductTagGeneralSection } from "./components/product-tag-general-section"
import { ProductTagProductSection } from "./components/product-tag-product-section"
import { productTagLoader } from "./loader"

const ALLOWED_TYPES = [ProductTagGeneralSection, ProductTagProductSection] as const

const Root = ({ children }: { children?: ReactNode }) => {
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

  return hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? (
    <SingleColumnPage showJSON showMetadata data={product_tag}>
      {children}
    </SingleColumnPage>
  ) : (
    <SingleColumnPage showJSON showMetadata data={product_tag}>
      <ProductTagGeneralSection productTag={product_tag} />
      <ProductTagProductSection productTag={product_tag} />
    </SingleColumnPage>
  )
}

export const ProductTagDetailPage = Object.assign(Root, {
  GeneralSection: ProductTagGeneralSection,
  ProductSection: ProductTagProductSection,
})
