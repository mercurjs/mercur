import type { ProductAttributeDTO } from "@mercurjs/types"

import { ProductSidebar, ProductsPagination } from "@/components/organisms"
import {
  ProductListingNoResultsView,
  ProductListingProductsView,
} from "@/components/molecules"
import { PRODUCT_LIMIT } from "@/const"
import { searchCatalog, type SearchCatalogFilters } from "@/lib/data/search"
import { searchHitToProduct } from "@/lib/helpers/search-hit-to-product"

export type ProductListingSearchParams = Record<
  string,
  string | string[] | undefined
>

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value

const splitParam = (value: string | string[] | undefined): string[] => {
  const raw = first(value)
  return raw ? raw.split(",").filter(Boolean) : []
}

export const SearchProductsListing = async ({
  category_id,
  collection_id,
  seller_handle,
  attributes,
  searchParams = {},
  locale = process.env.NEXT_PUBLIC_DEFAULT_REGION,
}: {
  category_id?: string
  collection_id?: string
  locale?: string
  seller_handle?: string
  attributes?: ProductAttributeDTO[]
  searchParams?: ProductListingSearchParams
  currency_code?: string
}) => {
  const query = first(searchParams.query) || ""
  const page = +(first(searchParams.page) || 1)

  const attributeFilters: Record<string, string[]> = {}
  for (const [key, value] of Object.entries(searchParams)) {
    if (key.startsWith("attr_")) {
      const ids = splitParam(value)
      if (ids.length) attributeFilters[key.slice(5)] = ids
    }
  }

  const category_ids = [
    ...(category_id ? [category_id] : []),
    ...splitParam(searchParams.category),
  ]
  const collection_ids = [
    ...(collection_id ? [collection_id] : []),
    ...splitParam(searchParams.collection),
  ]

  const filters: SearchCatalogFilters = {
    type: "product",
    seller_handle,
    category_ids: category_ids.length ? category_ids : undefined,
    collection_ids: collection_ids.length ? collection_ids : undefined,
    attributes: Object.keys(attributeFilters).length
      ? attributeFilters
      : undefined,
  }

  const result = locale
    ? await searchCatalog({
        query: query || undefined,
        page: page - 1,
        hitsPerPage: PRODUCT_LIMIT,
        filters,
        countryCode: locale,
      })
    : { hits: [], count: 0, limit: PRODUCT_LIMIT, offset: 0, facets: undefined }

  const products = result.hits.map(searchHitToProduct)
  const count = result.count
  const pages = Math.max(Math.ceil(count / PRODUCT_LIMIT), 1)

  return (
    <div className="min-h-[70vh]">
      <div className="flex justify-between w-full items-center">
        <div className="my-4 label-md">{`${count} listings`}</div>
      </div>
      <div className="md:flex gap-4">
        <div className="w-[280px] flex-shrink-0 hidden md:block">
          <ProductSidebar
            facets={result.facets}
            attributes={attributes}
            category_id={category_id}
            collection_id={collection_id}
          />
        </div>
        <div className="w-full flex flex-col">
          {products.length > 0 ? (
            <ProductListingProductsView products={products} />
          ) : (
            <ProductListingNoResultsView />
          )}

          <div className="mt-auto">
            <ProductsPagination pages={pages} />
          </div>
        </div>
      </div>
    </div>
  )
}
