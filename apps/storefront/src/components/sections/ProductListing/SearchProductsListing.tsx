import { Suspense } from "react"

import ProductListingNoResultsView from "@/components/molecules/ProductListingNoResultsView/ProductListingNoResultsView"
import { ProductCard } from "@/components/organisms/ProductCard/ProductCard"
import { ProductListingActiveFilters } from "@/components/organisms/ProductListingActiveFilters/ProductListingActiveFilters"
import { ProductListingHeader } from "@/components/organisms/ProductListingHeader/ProductListingHeader"
import { ProductSearchSidebar } from "@/components/organisms/ProductSearchSidebar/ProductSearchSidebar"
import { ProductsPagination } from "@/components/organisms/ProductsPagination/ProductsPagination"
import { PRODUCT_LIMIT } from "@/const"
import { searchListing, type ListingScope } from "@/lib/data/search"
import { parseListingParams } from "@/lib/helpers/listing-params"

import { ListingFacetsProvider, ListingFacetsPublisher } from "./ListingFacetsStore"
import { ListingResultsBoundary } from "./ListingResultsBoundary"

export type ListingSearchParams = Promise<Record<string, string | string[] | undefined>>

// Cards above the fold load eagerly; the rest wait for the viewport.
const EAGER_CARDS = 4

export const SearchProductsListing = ({
  category_id,
  collection_id,
  locale,
  searchParams,
}: {
  category_id?: string | string[]
  collection_id?: string
  locale: string
  searchParams: ListingSearchParams
}) => {
  const scope: ListingScope = {
    countryCode: locale,
    category_ids: category_id,
    collection_id,
    limit: PRODUCT_LIMIT,
  }

  return (
    <ListingFacetsProvider>
      <div className="min-h-[70vh]" data-testid="product-listing-container">
        <div className="hidden md:block min-h-6">
          <Suspense fallback={null}>
            <ProductListingActiveFilters />
          </Suspense>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <aside className="md:col-span-1">
            <Suspense fallback={null}>
              <ProductSearchSidebar />
            </Suspense>
          </aside>
          <div className="md:col-span-3 w-full flex flex-col">
            <Suspense fallback={null}>
              <ProductListingHeader />
            </Suspense>
            <Suspense fallback={<ListingResultsSkeleton />}>
              <ListingResultsBoundary fallback={<ListingResultsSkeleton />}>
                <ListingResults scope={scope} searchParams={searchParams} />
              </ListingResultsBoundary>
            </Suspense>
          </div>
        </div>
      </div>
    </ListingFacetsProvider>
  )
}

const ListingResults = async ({
  scope,
  searchParams,
}: {
  scope: ListingScope
  searchParams: ListingSearchParams
}) => {
  const params = parseListingParams(await searchParams)
  const { products, count, facets } = await searchListing(scope, params)
  const pages = Math.ceil(count / scope.limit) || 1

  return (
    <>
      <ListingFacetsPublisher facets={facets} count={count} />
      {products.length ? (
        <ul className="flex flex-wrap gap-4" data-testid="product-listing-products">
          {products.map((product, index) => (
            <li key={product.id} className="w-full lg:w-[calc(25%-1rem)] min-w-[250px]">
              <ProductCard
                product={product}
                eager={index < EAGER_CARDS}
                className="w-full h-full lg:w-full min-w-0"
              />
            </li>
          ))}
        </ul>
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
