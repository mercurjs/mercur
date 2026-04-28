import { ReactNode, Children } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { SingleColumnPage } from "../../../components/layout/pages"
import { useProductBrand } from "../../../hooks/api/product-brands"

import { ProductBrandGeneralSection } from "./components/product-brand-general-section"
import { ProductBrandProductSection } from "./components/product-brand-product-section"
import { productBrandLoader } from "./loader"

const Root = ({ children }: { children?: ReactNode }) => {
  const { id } = useParams()
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof productBrandLoader>
  >

  const { product_brand, isPending, isError, error } = useProductBrand(
    id!,
    undefined,
    {
      initialData,
    }
  )

  if (isPending || !product_brand) {
    return <SingleColumnPageSkeleton sections={2} showJSON showMetadata />
  }

  if (isError) {
    throw error
  }

  return Children.count(children) > 0 ? (
    <SingleColumnPage showJSON showMetadata data={product_brand}>
      {children}
    </SingleColumnPage>
  ) : (
    <SingleColumnPage showJSON showMetadata data={product_brand}>
      <ProductBrandGeneralSection productBrand={product_brand} />
      <ProductBrandProductSection productBrand={product_brand} />
    </SingleColumnPage>
  )
}

export const ProductBrandDetailPage = Object.assign(Root, {
  GeneralSection: ProductBrandGeneralSection,
  ProductSection: ProductBrandProductSection,
})
