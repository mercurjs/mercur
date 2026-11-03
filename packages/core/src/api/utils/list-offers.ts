import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { ProductStatus, SellerStatus } from "@mercurjs/types"

import {
  type IndexedShape,
  isIndexable,
  isIndexEngineEnabled,
  isOrderIndexable,
  reconcileCount,
  withClause,
} from "./index-engine"
import { resolveVisibleSellerIds } from "./sellers"

// `q` is left out on purpose: the index matches whole tokens where query.graph
// matches substrings, and search must not change with the engine.
const INDEXED_OFFER: IndexedShape = {
  id: true,
  seller_id: true,
  product_id: true,
  variant_id: true,
  sku: true,
  condition_id: true,
  created_at: true,
  updated_at: true,
  seller: { id: true, status: true, closed_from: true, closed_to: true },
  product: { id: true, status: true },
}

type Pagination = {
  skip?: number
  take?: number
  order?: Record<string, unknown>
}

// query.graph cannot filter on linked-module fields, hence one shape per engine.
export type OfferVisibility = {
  index: Record<string, unknown>
  graph: (filters: Record<string, unknown>) => Promise<Record<string, unknown>>
}

// Truncated to the minute so requests within the same minute share one cached
// seller lookup and one index query plan.
const visibilityNow = () => new Date(Math.floor(Date.now() / 60_000) * 60_000)

export const storeSellerVisibilityFilter = (now: Date = visibilityNow()) => ({
  status: SellerStatus.OPEN,
  $and: [
    { $or: [{ closed_from: { $eq: null } }, { closed_from: { $gt: now } }] },
    { $or: [{ closed_to: { $eq: null } }, { closed_to: { $lt: now } }] },
  ],
})

export const getStoreOfferVisibility = (
  scope: MedusaContainer
): OfferVisibility => ({
  index: {
    seller: storeSellerVisibilityFilter(),
    product: { status: ProductStatus.PUBLISHED },
  },
  graph: async (filters) => {
    const query = scope.resolve(ContainerRegistrationKeys.QUERY)
    const requestedProductIds = filters.product_id as
      | string
      | string[]
      | undefined

    const [sellerIds, { data: products }] = await Promise.all([
      resolveVisibleSellerIds(scope),
      query.graph({
        entity: "product",
        fields: ["id"],
        filters: {
          status: ProductStatus.PUBLISHED,
          ...(requestedProductIds ? { id: requestedProductIds } : {}),
        },
      }),
    ])

    return {
      seller_id: sellerIds,
      product_id: products.map((product: { id: string }) => product.id),
    }
  },
})

type ListOffersInput = {
  fields: string[]
  filters?: Record<string, unknown>
  visibility?: OfferVisibility
  pagination?: Pagination
}

type ListOffersResult<T> = {
  offers: T[]
  count: number
  estimate_count?: number
  offset: number
  limit: number
}

export const listOffers = async <T = Record<string, unknown>>(
  scope: MedusaContainer,
  { fields, filters = {}, visibility, pagination }: ListOffersInput
): Promise<ListOffersResult<T>> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const indexFilters = withClause(filters, visibility?.index)

  if (
    isIndexEngineEnabled(scope) &&
    isIndexable(indexFilters, INDEXED_OFFER) &&
    isOrderIndexable(pagination?.order, INDEXED_OFFER)
  ) {
    const { data, metadata } = await query.index({
      entity: "offer",
      fields,
      filters: indexFilters,
      pagination,
    })

    const skip = metadata?.skip ?? pagination?.skip ?? 0
    const take = metadata?.take ?? pagination?.take
    const estimate = metadata?.estimate_count ?? 0

    return {
      offers: data as T[],
      count: reconcileCount(estimate, skip, take, data.length),
      estimate_count: estimate,
      offset: skip,
      limit: take ?? data.length,
    }
  }

  const graphFilters = withClause(
    filters,
    visibility ? await visibility.graph(filters) : undefined
  )

  const { data, metadata } = await query.graph({
    entity: "offer",
    fields,
    filters: graphFilters,
    pagination,
  })

  return {
    offers: data as T[],
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  }
}

type VisibilityOffer = {
  seller?: {
    status?: string | null
    closed_from?: string | Date | null
    closed_to?: string | Date | null
  } | null
  product?: { status?: string | null } | null
}

// Mirrors storeSellerVisibilityFilter for a single row read from the database,
// where the index's asynchronous sync must not decide a 404.
export const isOfferVisibleInStore = (
  offer: VisibilityOffer,
  now: Date = visibilityNow()
) => {
  const { seller, product } = offer
  if (!seller || seller.status !== SellerStatus.OPEN) {
    return false
  }
  if (product?.status !== ProductStatus.PUBLISHED) {
    return false
  }
  const closedFrom = seller.closed_from ? new Date(seller.closed_from) : null
  const closedTo = seller.closed_to ? new Date(seller.closed_to) : null
  return (
    (!closedFrom || closedFrom > now) && (!closedTo || closedTo < now)
  )
}
