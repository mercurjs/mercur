import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { ProductStatus } from "@mercurjs/types"

import {
  type IndexedShape,
  type Pagination,
  isIndexable,
  isIndexEngineEnabled,
  isOrderIndexable,
  reconcileCount,
  withClause,
} from "./index-engine"
import {
  isSellerVisibleInStore,
  resolveVisibleSellerIds,
  storeSellerVisibilityFilter,
} from "./sellers"

// `q` is left out on purpose, see INDEXED_PRODUCT in list-products.ts.
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

// query.graph cannot filter on linked-module fields, hence one shape per engine.
export type OfferVisibility = {
  index: Record<string, unknown>
  graph: (filters: Record<string, unknown>) => Promise<Record<string, unknown>>
}

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

  const indexFilters = withClause(
    Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== undefined)
    ),
    visibility?.index
  )

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
  seller?: Parameters<typeof isSellerVisibleInStore>[0] | null
  product?: { status?: string | null } | null
}

// Read from the database, not the index: the index syncs asynchronously and
// must not decide a 404.
export const isOfferVisibleInStore = (offer: VisibilityOffer) =>
  !!offer.seller &&
  isSellerVisibleInStore(offer.seller) &&
  offer.product?.status === ProductStatus.PUBLISHED
