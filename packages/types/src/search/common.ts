import { ModuleProviderExports } from "@medusajs/types"

/**
 * A single searchable document. One flat shape covers both products and
 * per-offer hits. Filter/facet fields carry both the id and its label so the
 * store route can render facets without a second lookup.
 */
export interface SearchDoc {
  id: string
  type: "product" | "offer"
  title: string
  description?: string
  handle?: string
  thumbnail?: string
  seller_handle?: string
  seller_status?: string
  collection_id?: string
  collection?: string
  category_ids?: string[]
  categories?: string[]
  product_id?: string
  variant_id?: string
  sku?: string
  /**
   * Facetable + filterable composite tokens `attr:<attribute_handle>:<value_id>`.
   * The only attribute field that enters a provider's index schema. Only values
   * whose `attribute.is_filterable === true` are tokenized. Offers inherit their
   * parent product's tokens.
   */
  attribute_tokens?: string[]
  /**
   * Stored (non-indexed) label-join source for grouped attribute facets. Offers
   * inherit their parent product's entries.
   */
  attributes?: SearchDocAttribute[]
  /**
   * Stored (non-indexed) price snapshot keyed by `region_id`, read at request
   * time as `prices[region_id]`. Buybox for a product doc, own price for an
   * offer doc. Never enters the index schema.
   */
  prices?: Record<string, SearchDocPrice>
  /**
   * Projected by the provider at search time from `prices[context.region_id]`
   * (null when the region has no stored price). Not indexed.
   */
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

/**
 * Universal query bits shared by every provider. `context` is display/pricing
 * context (WHO/WHAT the search is for) — not a narrowing predicate. `filters`
 * are provider-defined narrowing predicates; each provider extends this and
 * declares a concrete `filters` shape.
 */
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
  // Provider-built, already labelled. The store route returns these verbatim.
  facets?: SearchFacets
}

/**
 * The provider contract. Three verbs, mirroring the small `IFileProvider`
 * surface. Generic over the query so each provider states exactly which filters
 * it accepts.
 */
export interface SearchProvider<
  TQuery extends SearchQueryBase = SearchQueryBase,
> {
  index(docs: SearchDoc[]): Promise<void>
  remove(ids: string[]): Promise<void>
  search(query: TQuery): Promise<SearchResults>
}

export interface SearchModuleOptions {
  /**
   * The single active search provider. When omitted, the module falls back to
   * the bundled `search-orama` provider.
   */
  provider?: {
    resolve: string | ModuleProviderExports
    id: string
    options?: Record<string, unknown>
  }
}
