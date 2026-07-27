import { MedusaError } from "@medusajs/framework/utils"

import { SearchFilters, SearchSort, SearchSortField } from "./types"
import { SearchQueryFilters } from "./validators"

const ALLOWED_SORT_FIELDS: Record<string, SearchSortField> = {
  price: "price",
  created_at: "created_at",
  relevance: "relevance",
}

const toArray = (value: string | string[] | undefined): string[] | undefined => {
  if (value === undefined) {
    return undefined
  }
  return Array.isArray(value) ? value : [value]
}

export const buildSearchFilters = (
  query: SearchQueryFilters
): SearchFilters => {
  const filters: SearchFilters = {}

  const categoryIds = toArray(query.category_id)
  if (categoryIds) {
    filters.category_ids = categoryIds
  }
  const collectionId = toArray(query.collection_id)
  if (collectionId) {
    filters.collection_id = collectionId
  }
  const typeId = toArray(query.type_id)
  if (typeId) {
    filters.type_id = typeId
  }
  const tagIds = toArray(query.tag_id)
  if (tagIds) {
    filters.tag_ids = tagIds
  }
  const sellerIds = toArray(query.seller_id)
  if (sellerIds) {
    filters.seller_ids = sellerIds
  }
  if (query.attributes) {
    filters.attributes = Object.fromEntries(
      Object.entries(query.attributes).map(([key, value]) => [
        key,
        toArray(value) ?? [],
      ])
    )
  }
  if (query.min_price !== undefined || query.max_price !== undefined) {
    filters.price = {}
    if (query.min_price !== undefined) {
      filters.price.gte = query.min_price
    }
    if (query.max_price !== undefined) {
      filters.price.lte = query.max_price
    }
  }

  return filters
}

export const buildSearchSort = (
  order: Record<string, string> | undefined
): SearchSort | undefined => {
  const entry = order ? Object.entries(order)[0] : undefined
  if (!entry) {
    return undefined
  }
  const [field, direction] = entry
  const mapped = ALLOWED_SORT_FIELDS[field]
  if (!mapped) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Order field ${field} is not valid`
    )
  }
  return { field: mapped, order: direction === "DESC" ? "desc" : "asc" }
}
