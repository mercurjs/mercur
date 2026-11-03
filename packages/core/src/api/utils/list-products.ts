import {
  ContainerRegistrationKeys,
  isPresent,
  Modules,
  useCache,
} from "@medusajs/framework/utils"
import type {
  IIndexService,
  IndexQueryConfig,
  MedusaContainer,
} from "@medusajs/framework/types"

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
  cache?: ListProductsCache
  /**
   * Count every match instead of returning the planner estimate. The index
   * estimate badly undercounts filters on product fields (they are JSONB
   * containment checks with no statistics), so paginated tables need this.
   */
  exactCount?: boolean
}

export type ListProductsCache = {
  ttl?: number
  /**
   * Tags for data the automatic tags cannot see, kept alongside them. Link
   * rows are the usual case: attaching one only clears `Link…:list:*`.
   */
  tags?: string[]
}

// A write clears the cache and starts the asynchronous index sync from the same
// event, so any request in between re-caches the pre-write index state and
// nothing clears it afterwards. The TTL is the only bound on that staleness.
export const INDEX_LIST_CACHE_TTL = 5

const toQueryOptions = (
  cache: ListProductsCache | undefined,
  locale: string | undefined,
  ttl: number | undefined
) => ({
  ...(cache
    ? {
        cache: {
          enable: true,
          ...(ttl !== undefined ? { ttl } : {}),
          // Automatic tags come from the returned rows, so an empty page would
          // carry none and survive the next product create until its TTL.
          tags: ["Product:list:*", ...(cache.tags ?? [])],
          computeAutomaticTags: true,
        },
      }
    : {}),
  ...(locale ? { locale } : {}),
})

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

// query.index only exposes the planner estimate. This issues the same ids-only
// call query.index makes (fields and filters keyed by the entity), minus the
// pagination, which returns every match with no LIMIT and no count_estimate.
const countIndexedProducts = async (
  scope: MedusaContainer,
  filters: Record<string, unknown>,
  cache: ListProductsCache | undefined,
  ttl: number
): Promise<number> => {
  const { count } = await useCache(
    async () => {
      const { data } = await scope
        .resolve<IIndexService>(Modules.INDEX)
        .query({
          fields: ["product.id"],
          filters: { product: filters } as IndexQueryConfig<"product">["filters"],
          idsOnly: true,
        })
      return { count: data.length }
    },
    {
      enable: !!cache,
      key: ["mercur:product-count", filters],
      tags: ["Product:list:*", ...(cache?.tags ?? [])],
      ttl,
      container: scope,
    }
  )
  return count
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
    exactCount,
  }: ListProductsInput
): Promise<ListProductsResult<T>> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const indexFilters = withClause(toIndexFilters(filters), visibility?.index)

  if (
    !withDeleted &&
    isIndexEngineEnabled(scope) &&
    isIndexable(indexFilters, INDEXED_PRODUCT) &&
    isOrderIndexable(pagination?.order)
  ) {
    const indexTtl = Math.min(
      cache?.ttl ?? INDEX_LIST_CACHE_TTL,
      INDEX_LIST_CACHE_TTL
    )

    const [{ data, metadata }, exact] = await Promise.all([
      query.index(
        {
          entity: "product",
          fields,
          filters: indexFilters,
          pagination,
        },
        toQueryOptions(cache, locale, indexTtl)
      ),
      exactCount
        ? countIndexedProducts(scope, indexFilters, cache, indexTtl)
        : undefined,
    ])

    const skip = metadata?.skip ?? pagination?.skip ?? 0
    const take = metadata?.take ?? pagination?.take
    const estimate = metadata?.estimate_count ?? 0

    return {
      products: data as T[],
      count: exact ?? reconcileCount(estimate, skip, take, data.length),
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
    toQueryOptions(cache, locale, cache?.ttl)
  )

  return {
    products: data as T[],
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  }
}
