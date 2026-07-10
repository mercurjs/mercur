export type SearchProductPriceInput = {
  region_id: string
  currency_code: string
  min_amount: number
  max_amount: number
}

export type SearchProductInput = {
  product_id: string
  title: string
  handle: string
  description?: string | null
  thumbnail?: string | null
  status: string
  collection_id?: string | null
  type_id?: string | null
  category_ids?: string[]
  tag_ids?: string[]
  seller_ids?: string[]
  variant_skus?: string[]
  attributes?: Record<string, string[]>
  metadata?: Record<string, unknown> | null
  prices?: SearchProductPriceInput[]
}

export type SearchPriceRangeFilter = {
  gte?: number
  lte?: number
}

export type SearchFilters = {
  category_ids?: string[]
  collection_id?: string | string[]
  type_id?: string | string[]
  tag_ids?: string[]
  seller_ids?: string[]
  attributes?: Record<string, string[]>
  price?: SearchPriceRangeFilter
}

export type SearchSortField = "price" | "created_at" | "relevance"

export type SearchSort = {
  field: SearchSortField
  order?: "asc" | "desc"
}

export type SearchPagination = {
  skip?: number
  take?: number
}

export type SearchParams = {
  q?: string
  region_id: string
  filters?: SearchFilters
  sort?: SearchSort
  pagination?: SearchPagination
}

export type SearchResultPrice = {
  region_id: string
  currency_code: string
  min_amount: number
  max_amount: number
}

export type SearchResultProduct = {
  id: string
  product_id: string
  title: string
  handle: string
  description: string | null
  thumbnail: string | null
  status: string
  collection_id: string | null
  type_id: string | null
  category_ids: string[]
  tag_ids: string[]
  seller_ids: string[]
  attributes: Record<string, string[]>
  metadata: Record<string, unknown> | null
  calculated_price: SearchResultPrice | null
}

export type SearchResult = {
  products: SearchResultProduct[]
  count: number
}

export type FacetBucket = {
  value: string
  count: number
}

export type PriceRangeBucketInput = {
  gte?: number
  lte?: number
}

export type PriceRangeFacetBucket = {
  gte: number | null
  lte: number | null
  count: number
}

// Raw query-field shape (e.g. from an HTTP route's filterable fields) that the
// module maps into structured SearchFilters / SearchSort.
export type SearchQueryFilters = {
  q?: string
  region_id: string
  category_id?: string | string[]
  collection_id?: string | string[]
  type_id?: string | string[]
  tag_id?: string | string[]
  seller_id?: string | string[]
  attributes?: Record<string, string | string[]>
  min_price?: number
  max_price?: number
}

export type FacetParams = {
  q?: string
  region_id: string
  filters?: SearchFilters
  price_ranges?: PriceRangeBucketInput[]
}

export type FacetResult = {
  categories: FacetBucket[]
  collections: FacetBucket[]
  types: FacetBucket[]
  tags: FacetBucket[]
  attributes: Record<string, FacetBucket[]>
  price_ranges: PriceRangeFacetBucket[]
}
