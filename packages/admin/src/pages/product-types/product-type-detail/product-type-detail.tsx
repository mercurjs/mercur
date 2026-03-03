import { ReactNode } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { SingleColumnPage } from "../../../components/layout/pages"
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition"
import { useProductType } from "../../../hooks/api/product-types"

import { ProductTypeGeneralSection } from "./components/product-type-general-section"
import { ProductTypeProductSection } from "./components/product-type-product-section"
import { productTypeLoader } from "./loader"

const ALLOWED_TYPES = [ProductTypeGeneralSection, ProductTypeProductSection] as const

const Root = ({ children }: { children?: ReactNode }) => {
  const { id } = useParams()
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof productTypeLoader>
  >

  const { product_type, isPending, isError, error } = useProductType(
    id!,
    undefined,
    {
      initialData,
    }
  )

  if (isPending || !product_type) {
    return <SingleColumnPageSkeleton sections={2} showJSON showMetadata />
  }

  if (isError) {
    throw error
  }

  return hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? (
    <SingleColumnPage showJSON showMetadata data={product_type}>
      {children}
    </SingleColumnPage>
  ) : (
    <SingleColumnPage showJSON showMetadata data={product_type}>
      <ProductTypeGeneralSection productType={product_type} />
      <ProductTypeProductSection productType={product_type} />
    </SingleColumnPage>
  )
}

export const ProductTypeDetailPage = Object.assign(Root, {
  GeneralSection: ProductTypeGeneralSection,
  ProductSection: ProductTypeProductSection,
})
