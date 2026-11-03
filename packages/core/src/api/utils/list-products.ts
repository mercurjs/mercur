import {
  ContainerRegistrationKeys,
  isPresent,
  Modules,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"

type IndexedShape = { [key: string]: true | IndexedShape }

// Mirrors the Product slice of @medusajs/index's default schema plus the
// filterable product_seller link. Anything outside it (categories, tags,
// variant options, deleted rows, ...) is answered by query.graph instead,
// because the index rejects non-indexed keys outright.
const INDEXED_PRODUCT: IndexedShape = {
  id: true,
  q: true,
  title: true,
  handle: true,
  status: true,
  type_id: true,
  collection_id: true,
  is_giftcard: true,
  external_id: true,
  created_at: true,
  updated_at: true,
  variants: {
    id: true,
    sku: true,
    product_id: true,
    prices: {
      id: true,
      amount: true,
      currency_code: true,
      price_list_id: true,
    },
  },
  sales_channels: { id: true, is_disabled: true },
  product_seller: { id: true },
}

const LOGICAL_OPERATORS = ["$and", "$or", "$not"]

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  !(value instanceof Date)

const isIndexable = (
  filters: Record<string, unknown>,
  shape: IndexedShape
): boolean =>
  Object.entries(filters).every(([key, value]) => {
    if (value === undefined) {
      return true
    }

    if (LOGICAL_OPERATORS.includes(key)) {
      const entries = Array.isArray(value) ? value : [value]
      return entries.every(
        (entry) => isPlainObject(entry) && isIndexable(entry, shape)
      )
    }

    const node = shape[key]
    if (!node) {
      return false
    }
    if (node === true) {
      return true
    }

    return isPlainObject(value) && isIndexable(value, node)
  })

const isOrderIndexable = (order: Record<string, unknown> | undefined) =>
  !order ||
  Object.keys(order).every((path) => {
    let node: true | IndexedShape | undefined = INDEXED_PRODUCT
    for (const segment of path.split(".")) {
      if (!node || node === true) {
        return false
      }
      node = node[segment]
    }
    return node === true
  })

const toIndexFilters = (
  filters: Record<string, unknown>
): Record<string, unknown> => {
  const {
    sales_channel_id: salesChannelId,
    price_list_id: priceListId,
    ...rest
  } = filters

  const next: Record<string, unknown> = { ...rest }

  if (isPresent(salesChannelId)) {
    next.sales_channels = {
      ...(isPlainObject(next.sales_channels) ? next.sales_channels : {}),
      id: salesChannelId,
    }
  }

  if (isPresent(priceListId)) {
    const variants = isPlainObject(next.variants) ? next.variants : {}
    const prices = isPlainObject(variants.prices) ? variants.prices : {}
    next.variants = { ...variants, prices: { ...prices, price_list_id: priceListId } }
  }

  // Same workaround as Medusa's own index-backed product routes: full-text
  // search only spans joined entities that appear in the filter structure.
  if (isPresent(next.q) && !next.variants) {
    next.variants = {}
  }

  return next
}

// Detect via the container, not FeatureFlag: core and the host app can load
// different @medusajs/framework copies, each with its own flag router.
export const isIndexEngineEnabled = (scope: MedusaContainer): boolean => {
  try {
    return Boolean(scope.resolve(Modules.INDEX, { allowUnregistered: true }))
  } catch {
    return false
  }
}

type Pagination = {
  skip?: number
  take?: number
  order?: Record<string, unknown>
}

// query.graph cannot filter on linked-module fields, so a scope that relies on
// a link (e.g. product_seller) needs its own shape per engine. The graph shape
// is lazy because it usually needs a prefetch only the fallback pays for.
export type ProductVisibility = {
  index: Record<string, unknown>
  graph: () => Promise<Record<string, unknown>>
}

const withClause = (
  filters: Record<string, unknown>,
  clause: Record<string, unknown> | undefined
) => {
  if (!clause) {
    return filters
  }
  const existing = Array.isArray(filters.$and) ? filters.$and : []
  return { ...filters, $and: [...existing, clause] }
}

export type ListProductsInput = {
  fields: string[]
  filters?: Record<string, unknown>
  visibility?: ProductVisibility
  pagination?: Pagination
  withDeleted?: boolean
  locale?: string
  cache?: boolean
}

export type ListProductsResult<T> = {
  products: T[]
  count: number
  estimate_count?: number
  offset: number
  limit: number
}

// estimate_count comes from the Postgres planner and is meaningless for small
// result sets, so pin it to the exact value whenever the page is not full.
const reconcileCount = (
  estimate: number,
  skip: number,
  take: number | undefined,
  returned: number
) => {
  if (take === undefined || returned < take) {
    return skip + returned
  }
  return Math.max(estimate, skip + returned + 1)
}

export const listProducts = async <T = Record<string, unknown>>(
  scope: MedusaContainer,
  {
    fields,
    filters = {},
    visibility,
    pagination,
    withDeleted,
    locale,
    cache,
  }: ListProductsInput
): Promise<ListProductsResult<T>> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const options = {
    ...(cache ? { cache: { enable: true } } : {}),
    ...(locale ? { locale } : {}),
  }

  const indexFilters = withClause(toIndexFilters(filters), visibility?.index)

  if (
    !withDeleted &&
    isIndexEngineEnabled(scope) &&
    isIndexable(indexFilters, INDEXED_PRODUCT) &&
    isOrderIndexable(pagination?.order)
  ) {
    const { data, metadata } = await query.index(
      {
        entity: "product",
        fields,
        filters: indexFilters,
        pagination,
      },
      options
    )

    const skip = metadata?.skip ?? pagination?.skip ?? 0
    const take = metadata?.take ?? pagination?.take
    const estimate = metadata?.estimate_count ?? 0

    return {
      products: data as T[],
      count: reconcileCount(estimate, skip, take, data.length),
      estimate_count: estimate,
      offset: skip,
      limit: take ?? data.length,
    }
  }

  const graphFilters = withClause(
    filters,
    visibility ? await visibility.graph() : undefined
  )

  const { data, metadata } = await query.graph(
    {
      entity: "product",
      fields,
      filters: graphFilters,
      pagination,
      withDeleted,
    },
    options
  )

  return {
    products: data as T[],
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  }
}
