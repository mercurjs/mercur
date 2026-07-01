"use client"

import { HttpTypes } from "@medusajs/types"
import {
  AlgoliaProductSidebar,
  ProductListingActiveFilters,
  ProductsPagination,
} from "@/components/organisms"
import {
  ProductListingLoadingView,
  ProductListingNoResultsView,
  ProductListingProductsView,
} from "@/components/molecules"
import { useSearchParams } from "next/navigation"
import { getFacedFilters } from "@/lib/helpers/get-faced-filters"
import { PRODUCT_LIMIT } from "@/const"
import { ProductListingSkeleton } from "@/components/organisms/ProductListingSkeleton/ProductListingSkeleton"
import { useEffect, useMemo, useState } from "react"
import { searchProducts } from "@/lib/data/products"
import { FacetModel } from "@/components/organisms/ProductSidebar/AlgoliaProductSidebar"

export const AlgoliaProductsListing = ({
  category_id,
  collection_id,
  seller_handle,
  locale = process.env.NEXT_PUBLIC_DEFAULT_REGION,
  currency_code,
}: {
  category_id?: string
  collection_id?: string
  locale?: string
  seller_handle?: string
  currency_code: string
}) => {
  const searchParams = useSearchParams()

  const facetFilters: string = getFacedFilters(searchParams)
  const query: string = searchParams.get("query") || ""
  const page: number = +(searchParams.get("page") || 1)

  const filters = `${
    seller_handle
      ? `NOT seller:null AND seller.handle:${seller_handle} AND `
      : "NOT seller:null AND "
  }NOT seller.store_status:SUSPENDED AND supported_countries:${locale} AND variants.prices.currency_code:${currency_code} AND variants.prices.amount > 0${
    category_id
      ? ` AND categories.id:${category_id}${
          collection_id !== undefined
            ? ` AND collections.id:${collection_id}`
            : ""
        } ${facetFilters}`
      : ` ${facetFilters}`
  }`

  return (
      <ProductsListing
        locale={locale}
        currency_code={currency_code}
        filters={filters}
        query={query}
        page={page}
      />
  )
}

const ProductsListing = ({
  locale,
  currency_code,
  filters,
  query,
  page,
}: {
  locale?: string
  currency_code: string
  filters: string
  query: string
  page: number
}) => {
  const [products, setProducts] = useState<
    (HttpTypes.StoreProduct & { seller?: any })[]
  >([])
  const [facets, setFacets] = useState<Record<string, FacetModel[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [count, setCount] = useState(0)
  const [pages, setPages] = useState(1)

  const searchParams = useSearchParams()

  useEffect(() => {
    async function fetchProducts() {
      if (!locale) return

      try {
        setIsLoading(true)
        const result = await searchProducts({
          query: query || undefined,
          page: page - 1,
          hitsPerPage: PRODUCT_LIMIT,
          filters,
          currency_code,
          countryCode: locale,
        })

        setProducts(result.products)
        setFacets(result.facets)
        setCount(result.nbHits)
        setPages(result.nbPages)
      } catch (error) {
        setProducts([])
        setFacets({})
        setCount(0)
        setPages(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [locale, filters, query, page, currency_code])

  if (isLoading && products.length === 0) return <ProductListingSkeleton />

  return (
    <div className="min-h-[70vh]">
      <div className="flex justify-between w-full items-center">
        <div className="my-4 label-md">{`${count} listings`}</div>
      </div>
      <div className="hidden md:block">
        <ProductListingActiveFilters />
      </div>
      <div className="md:flex gap-4">
        <div className="w-[280px] flex-shrink-0 hidden md:block">
          <AlgoliaProductSidebar facets={facets} />
        </div>
        <div className="w-full flex flex-col">
          {isLoading && <ProductListingLoadingView />}

          {!isLoading && !products.length && <ProductListingNoResultsView />}

          {!isLoading && products.length > 0 && (
            <ProductListingProductsView products={products} />
          )}

          <div className="mt-auto">
            <ProductsPagination pages={pages} />
          </div>
        </div>
      </div>
    </div>
  )
}
