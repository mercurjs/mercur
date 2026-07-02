import { SearchQueryBase } from "@mercurjs/types"

/**
 * The concrete filter shape the `search-orama` provider accepts. Lives here,
 * not in `@mercurjs/types` — filters are provider-owned.
 */
export interface OramaSearchQuery extends SearchQueryBase {
  filters?: {
    type?: "product" | "offer"
    /** OR within, AND across the other filter types. */
    collection_ids?: string[]
    category_ids?: string[]
    seller_handle?: string
    /** Route forces this to `"open"`. */
    seller_status?: string
    /** attribute_handle -> selected value ids. OR within a handle, AND across. */
    attributes?: Record<string, string[]>
  }
}
