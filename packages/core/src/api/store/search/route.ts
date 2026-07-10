import { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import type SearchModuleService from "../../../modules/search/service"
import {
  SearchFilters,
  SearchSort,
  SearchSortField,
} from "../../../modules/search/types"
import { StoreGetSearchParamsType } from "./validators"

// Shape of req.filterableFields for this route, declared explicitly: z.infer
// over the validator (a createFindParams-merged schema) widens every field to
// `unknown`, so the offers/products routes likewise read structured
// req.filterableFields / req.queryConfig rather than typing validatedQuery.
type StoreSearchFilterableFields = {
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
  facets?: boolean
}

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

const buildFilters = (query: StoreSearchFilterableFields): SearchFilters => {
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

const buildSort = (
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

export const GET = async (
  req: MedusaStoreRequest<StoreGetSearchParamsType>,
  res: MedusaResponse
) => {
  const searchService = req.scope.resolve<SearchModuleService>(
    MercurModules.SEARCH
  )

  const query = req.filterableFields as unknown as StoreSearchFilterableFields
  const filters = buildFilters(query)
  const sort = buildSort(req.queryConfig.pagination.order)

  const skip = req.queryConfig.pagination.skip ?? 0
  const take = req.queryConfig.pagination.take ?? 20

  const { products, count } = await searchService.search({
    q: query.q,
    region_id: query.region_id,
    filters,
    sort,
    pagination: { skip, take },
  })

  const body: Record<string, unknown> = {
    products,
    count,
    offset: skip,
    limit: take,
  }

  if (query.facets) {
    body.facets = await searchService.getFacets({
      q: query.q,
      region_id: query.region_id,
      filters,
    })
  }

  res.json(body)
}
