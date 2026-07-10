"use client"

import { HttpTypes } from "@medusajs/types"
import {
  ProductListingActiveFilters,
  ProductsPagination,
} from "@/components/organisms"
import { ProductSearchSidebar } from "@/components/organisms/ProductSidebar/ProductSearchSidebar"
import {
  ProductListingLoadingView,
  ProductListingNoResultsView,
  ProductListingProductsView,
} from "@/components/molecules"
import { useSearchParams } from "next/navigation"
import { PRODUCT_LIMIT } from "@/const"
import { ProductListingSkeleton } from "@/components/organisms/ProductListingSkeleton/ProductListingSkeleton"
import { useEffect, useState } from "react"
import { searchProducts, type SearchFacets } from "@/lib/data/products"
import type { SortOptions } from "@/types/product"

const RESERVED_KEYS = new Set([
  "query",
  "page",
  "min_price",
  "max_price",
  "sortBy",
  "sale",
  "products[page]",
])

const EMPTY_FACETS: SearchFacets = {
  categories: [],
  collections: [],
  types: [],
  tags: [],
  attributes: {},
  price_ranges: [],
}

export const SearchProductsListing = ({
  category_id,
  collection_id,
  seller_id,
  locale = process.env.NEXT_PUBLIC_DEFAULT_REGION,
}: {
  category_id?: string
  collection_id?: string
  seller_id?: string
  locale?: string
}) => {
  const searchParams = useSearchParams()

  const query = searchParams.get("query") || ""
  const page = +(searchParams.get("page") || 1)
  const minPrice = searchParams.get("min_price") || ""
  const maxPrice = searchParams.get("max_price") || ""
  const sortBy = (searchParams.get("sortBy") as SortOptions | null) || undefined

  const attributes: Record<string, string | string[]> = {}
  searchParams.forEach((value, key) => {
    if (RESERVED_KEYS.has(key)) return
    const parts = value.split(",").filter(Boolean)
    attributes[key] = parts.length > 1 ? parts : parts[0] ?? value
  })

  const [products, setProducts] = useState<HttpTypes.StoreProduct[]>([])
  const [facets, setFacets] = useState<SearchFacets>(EMPTY_FACETS)
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const attributesKey = JSON.stringify(attributes)

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
          min_price: minPrice ? Number(minPrice) : undefined,
          max_price: maxPrice ? Number(maxPrice) : undefined,
          page,
          limit: PRODUCT_LIMIT,
          sortBy,
        })

        setProducts(result.products)
        setFacets(result.facets)
        setCount(result.count)
      } catch (error) {
        setProducts([])
        setFacets(EMPTY_FACETS)
        setCount(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    locale,
    category_id,
    collection_id,
    seller_id,
    query,
    page,
    minPrice,
    maxPrice,
    sortBy,
    attributesKey,
  ])

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
      <div className="md:flex gap-4">
        <div className="w-[280px] flex-shrink-0 hidden md:block">
          <ProductSearchSidebar facets={facets} />
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
