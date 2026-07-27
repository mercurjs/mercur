"use client"

import { HttpTypes } from "@medusajs/types"
import {
  ProductsPagination,
  ProductSearchSidebar,
  ProductListingActiveFilters,
} from "@/components/organisms"
import {
  ProductListingLoadingView,
  ProductListingNoResultsView,
  ProductListingProductsView,
} from "@/components/molecules"
import { useSearchParams } from "next/navigation"
import { PRODUCT_LIMIT } from "@/const"
import { ProductListingSkeleton } from "@/components/organisms/ProductListingSkeleton/ProductListingSkeleton"
import { useEffect, useMemo, useState } from "react"
import {
  getSearchFacets,
  searchProducts,
  type SearchFacets,
} from "@/lib/data/products"
import type { SortOptions } from "@/types/product"

const EMPTY_FACETS: SearchFacets = { attributes: {} }

// URL params that drive the listing itself rather than attribute filters.
const RESERVED_PARAMS = new Set([
  "query",
  "page",
  "sortBy",
  "min_price",
  "max_price",
])

export const SearchProductsListing = ({
  category_id,
  collection_id,
  seller_id,
  locale = process.env.NEXT_PUBLIC_DEFAULT_REGION,
}: {
  category_id?: string | string[]
  collection_id?: string
  seller_id?: string
  locale?: string
}) => {
  const searchParams = useSearchParams()
  const categoryKey = Array.isArray(category_id)
    ? category_id.join(",")
    : category_id

  const query = searchParams.get("query") || ""
  const page = +(searchParams.get("page") || 1)
  const sortBy = (searchParams.get("sortBy") as SortOptions | null) || undefined

  const [facets, setFacets] = useState<SearchFacets>(EMPTY_FACETS)
  const [products, setProducts] = useState<HttpTypes.StoreProduct[]>([])
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getSearchFacets()
      .then(setFacets)
      .catch(() => setFacets(EMPTY_FACETS))
  }, [])

  const searchParamsKey = searchParams.toString()
  const attributesKey = useMemo(() => {
    const selected: Record<string, string[]> = {}
    searchParams.forEach((raw, key) => {
      if (RESERVED_PARAMS.has(key) || !raw) {
        return
      }
      selected[key] = raw.split(",").filter(Boolean)
    })
    return JSON.stringify(selected)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParamsKey])
  const attributes = useMemo(
    () => JSON.parse(attributesKey) as Record<string, string[]>,
    [attributesKey]
  )

  useEffect(() => {
    async function fetchProducts() {
      if (!locale) return

      try {
        setIsLoading(true)
        const result = await searchProducts({
          query: query || undefined,
          countryCode: locale,
          category_id,
          collection_id,
          seller_id,
          attributes,
          page,
          limit: PRODUCT_LIMIT,
          sortBy,
        })

        setProducts(result.products)
        setCount(result.count)
      } catch (error) {
        setProducts([])
        setCount(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, categoryKey, collection_id, seller_id, query, page, sortBy, attributesKey])

  if (isLoading && products.length === 0) return <ProductListingSkeleton />

  const pages = Math.ceil(count / PRODUCT_LIMIT) || 1

  return (
    <div className="min-h-[70vh]">
      <div className="flex justify-between w-full items-center">
        <div className="my-4 label-md">{`${count} listings`}</div>
      </div>
      <div className="hidden md:block">
        <ProductListingActiveFilters />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <aside className="md:col-span-1">
          <ProductSearchSidebar facets={facets} />
        </aside>
        <div className="md:col-span-3 w-full flex flex-col">
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
