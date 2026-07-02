import { ModuleProviderExports } from "@medusajs/types"

export interface SearchDoc {
  id: string
  type: "product" | "offer"
  title: string
  description?: string
  handle?: string
  thumbnail?: string
  // Offers only — master products carry no seller (SPEC-015).
  seller_handle?: string
  collection_id?: string
  collection?: string
  category_ids?: string[]
  categories?: string[]
  product_id?: string
  variant_id?: string
  sku?: string
  // Composite tokens `attr:<attribute_handle>:<value_id>`; only is_filterable
  // attribute values are tokenized.
  attribute_tokens?: string[]
  attributes?: SearchDocAttribute[]
  // Price snapshot per region, computed at index time.
  prices?: Record<string, SearchDocPrice>
  calculated_price?: SearchDocPrice | null
}

export interface SearchDocAttribute {
  id: string
  handle: string
  name: string
  type: string
  values: Array<{ id: string; name: string }>
}

export interface SearchDocPrice {
  calculated_amount: number
  original_amount: number
  currency_code: string
}

export interface SearchQueryBase {
  q?: string
  limit?: number
  offset?: number
  context?: Record<string, unknown>
  filters?: Record<string, unknown>
}

export interface SearchFacetValue {
  id: string
  label: string
  count: number
}

export interface SearchFacetAttribute {
  handle: string
  label: string
  values: SearchFacetValue[]
}

export interface SearchFacets {
  collections: SearchFacetValue[]
  categories: SearchFacetValue[]
  attributes: SearchFacetAttribute[]
}

export interface SearchResults {
  hits: SearchDoc[]
  count: number
  facets?: SearchFacets
}

export interface SearchProvider<
  TQuery extends SearchQueryBase = SearchQueryBase,
> {
  index(docs: SearchDoc[]): Promise<void>
  remove(ids: string[]): Promise<void>
  search(query: TQuery): Promise<SearchResults>
}

export interface SearchModuleOptions {
  // Omit to fall back to the bundled `search-orama` provider.
  provider?: {
    resolve: string | ModuleProviderExports
    id: string
    options?: Record<string, unknown>
  }
}
