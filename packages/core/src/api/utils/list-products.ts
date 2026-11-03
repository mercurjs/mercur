import {
  ContainerRegistrationKeys,
  isPresent,
  Modules,
  promiseAll,
  useCache,
} from "@medusajs/framework/utils"
import type {
  IIndexService,
  IndexQueryConfig,
  MedusaContainer,
} from "@medusajs/framework/types"

type IndexedShape = { [key: string]: true | IndexedShape }

// The index rejects any key outside its schema, so only these reach it. `q` is
// left out on purpose: the index matches whole tokens (plainto_tsquery) where
// query.graph matches substrings, and search must not change with the engine.
const INDEXED_PRODUCT: IndexedShape = {
  id: true,
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

const CROSS_MODULE_KEYS = ["product_seller", "sales_channels"]
const CROSS_MODULE_VARIANT_KEYS = ["prices"]
const LOGICAL_OPERATORS = ["$and", "$or", "$not"]
const INDEX_LIST_CACHE_TTL = 5

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  !(value instanceof Date)

const needsIndex = (filters: Record<string, unknown>): boolean =>
  Object.entries(filters).some(([key, value]) => {
    if (LOGICAL_OPERATORS.includes(key)) {
      const entries = Array.isArray(value) ? value : [value]
      return entries.some((entry) => isPlainObject(entry) && needsIndex(entry))
    }
    if (CROSS_MODULE_KEYS.includes(key)) {
      return true
    }
    return (
      key === "variants" &&
      isPlainObject(value) &&
      Object.keys(value).some((k) => CROSS_MODULE_VARIANT_KEYS.includes(k))
    )
  })

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

  return next
}

// Checked through the container, not FeatureFlag: core and the host can load
// separate @medusajs/framework copies with separate flag routers.
const isIndexEngineEnabled = (scope: MedusaContainer) =>
  !!scope.resolve(Modules.INDEX, { allowUnregistered: true })

type Pagination = {
  skip?: number
  take?: number
  order?: Record<string, unknown>
}

// query.graph cannot filter on linked-module fields, hence one shape per engine.
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

type ListProductsCache = {
  ttl?: number
  tags?: string[]
}

type ListProductsInput = {
  fields: string[]
  filters?: Record<string, unknown>
  visibility?: ProductVisibility
  pagination?: Pagination
  withDeleted?: boolean
  locale?: string
  cache?: ListProductsCache
  exactCount?: boolean
}

type ListProductsResult<T> = {
  products: T[]
  count: number
  estimate_count?: number
  offset: number
  limit: number
}

// Automatic tags come from the returned rows, so an empty page has none, and
// variant writes only clear ProductVariant tags.
const listCacheTags = (cache: ListProductsCache | undefined) => [
  "Product:list:*",
  "ProductVariant:list:*",
  ...(cache?.tags ?? []),
]

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
          tags: listCacheTags(cache),
          computeAutomaticTags: true,
        },
      }
    : {}),
  ...(locale ? { locale } : {}),
})

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

// query.index only reports the planner estimate, which undercounts JSONB
// filters badly. This is the ids-only call query.index makes, without paging.
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
      tags: listCacheTags(cache),
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
    needsIndex(indexFilters) &&
    isIndexEngineEnabled(scope) &&
    isIndexable(indexFilters, INDEXED_PRODUCT) &&
    isOrderIndexable(pagination?.order)
  ) {
    // One event clears the cache and starts the async index sync, so a request
    // in between re-caches pre-write index state; the TTL bounds that.
    const indexTtl = Math.min(
      cache?.ttl ?? INDEX_LIST_CACHE_TTL,
      INDEX_LIST_CACHE_TTL
    )

    const [{ data, metadata }, exact] = await promiseAll([
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
