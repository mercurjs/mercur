import { Suspense } from "react"

import ProductListingNoResultsView from "@/components/molecules/ProductListingNoResultsView/ProductListingNoResultsView"
import ProductListingProductsView from "@/components/molecules/ProductListingProductsView/ProductListingProductsView"
import { ProductListingActiveFilters } from "@/components/organisms/ProductListingActiveFilters/ProductListingActiveFilters"
import { ProductSearchSidebar } from "@/components/organisms/ProductSearchSidebar/ProductSearchSidebar"
import { ProductsPagination } from "@/components/organisms/ProductsPagination/ProductsPagination"
import { PRODUCT_LIMIT } from "@/const"
import { getSearchFacets, searchProducts } from "@/lib/data/products"
import type { SortOptions } from "@/types/product"

import { ListingResultsBoundary } from "./ListingResultsBoundary"

export type ListingSearchParams = Promise<Record<string, string | string[] | undefined>>

// URL params that drive the listing itself rather than attribute filters.
const RESERVED_PARAMS = new Set(["query", "page", "sortBy", "min_price", "max_price"])

const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

export const SearchProductsListing = ({
  category_id,
  collection_id,
  seller_id,
  locale,
  searchParams,
}: {
  category_id?: string | string[]
  collection_id?: string
  seller_id?: string
  locale: string
  searchParams: ListingSearchParams
}) => (
  <div className="min-h-[70vh]" data-testid="product-listing-container">
    <div className="hidden md:block min-h-6">
      <Suspense fallback={null}>
        <ProductListingActiveFilters />
      </Suspense>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <aside className="md:col-span-1">
        <Suspense fallback={null}>
          <ListingFacets />
        </Suspense>
      </aside>
      <div className="md:col-span-3 w-full flex flex-col">
        <Suspense fallback={<ListingResultsSkeleton />}>
          <ListingResultsBoundary fallback={<ListingResultsSkeleton />}>
            <ListingResults
              category_id={category_id}
              collection_id={collection_id}
              seller_id={seller_id}
              locale={locale}
              searchParams={searchParams}
            />
          </ListingResultsBoundary>
        </Suspense>
      </div>
    </div>
  </div>
)

const ListingFacets = async () => {
  const facets = await getSearchFacets()
  return <ProductSearchSidebar facets={facets} />
}

const ListingResults = async ({
  category_id,
  collection_id,
  seller_id,
  locale,
  searchParams,
}: {
  category_id?: string | string[]
  collection_id?: string
  seller_id?: string
  locale: string
  searchParams: ListingSearchParams
}) => {
  const params = await searchParams

  const attributes: Record<string, string[]> = {}
  for (const [key, raw] of Object.entries(params)) {
    const value = firstValue(raw)
    if (RESERVED_PARAMS.has(key) || !value) continue
    attributes[key] = value.split(",").filter(Boolean)
  }

  const { products, count } = await searchProducts({
    query: firstValue(params.query) || undefined,
    countryCode: locale,
    category_id,
    collection_id,
    seller_id,
    attributes,
    page: Math.max(Number(firstValue(params.page)) || 1, 1),
    limit: PRODUCT_LIMIT,
    sortBy: (firstValue(params.sortBy) as SortOptions | undefined) || undefined,
  })

  const pages = Math.ceil(count / PRODUCT_LIMIT) || 1

  return (
    <>
      <div className="my-4 label-md" data-testid="product-listing-count">{`${count} listings`}</div>
      {products.length ? (
        <ProductListingProductsView products={products} />
      ) : (
        <ProductListingNoResultsView />
      )}
      <div className="mt-auto">
        <ProductsPagination pages={pages} />
      </div>
    </>
  )
}

const ListingResultsSkeleton = () => (
  <div aria-busy="true" data-testid="product-listing-results-skeleton">
    <div className="my-4 h-5 w-24 animate-pulse rounded-sm bg-secondary" />
    <ul className="flex flex-wrap gap-4">
      {Array.from({ length: 8 }, (_, index) => (
        <li
          key={index}
          className="h-[420px] w-full min-w-[250px] animate-pulse rounded-sm bg-secondary lg:w-[calc(25%-1rem)]"
        />
      ))}
    </ul>
  </div>
)
