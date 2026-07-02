import { SearchQueryBase } from "@mercurjs/types"

export interface OramaSearchQuery extends SearchQueryBase {
  filters?: {
    type?: "product" | "offer"
    collection_ids?: string[]
    category_ids?: string[]
    seller_handle?: string
    // attribute handle -> selected value ids
    attributes?: Record<string, string[]>
  }
}
