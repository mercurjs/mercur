import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"

// The index engine cannot filter on these; their presence forces a query.graph
// fallback (matches upstream's own /store/products handler).
const INDEX_UNSUPPORTED_KEYS = [
  "categories",
  "tags",
  "options",
  "option_value_id",
  "q",
]

const requiresGraph = (filters: Record<string, unknown>): boolean => {
  for (const [key, value] of Object.entries(filters)) {
    if (INDEX_UNSUPPORTED_KEYS.includes(key)) {
      return true
    }
    if ((key === "$and" || key === "$or") && Array.isArray(value)) {
      if (
        value.some((entry) =>
          requiresGraph((entry ?? {}) as Record<string, unknown>)
        )
      ) {
        return true
      }
    }
  }
  return false
}

// Detect via the container, not FeatureFlag: core and the host app can resolve
// different @medusajs/framework copies, so the flag router core reads is not the
// one the app populates. A resolvable index module is the reliable signal.
export const indexEngineEnabled = (scope: MedusaContainer): boolean => {
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

export type ProductListResult<T = Record<string, unknown>> = {
  products: T[]
  count: number
  offset: number
  limit: number
}

// The index engine only reports estimate_count, so exact count comes from a
// query.graph count over the same filters to preserve the response contract.
export const listProducts = async <T = Record<string, unknown>>(
  scope: MedusaContainer,
  {
    fields,
    filters,
    pagination,
  }: {
    fields: string[]
    filters: Record<string, unknown>
    pagination?: Pagination
  }
): Promise<ProductListResult<T>> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  if (indexEngineEnabled(scope) && !requiresGraph(filters)) {
    const { data: products, metadata } = await query.index({
      entity: "product",
      fields,
      filters,
      pagination,
    })

    const { metadata: countMetadata } = await query.graph({
      entity: "product",
      fields: ["id"],
      filters,
      pagination: { take: 1, skip: 0 },
    })

    return {
      products,
      count: countMetadata?.count ?? 0,
      offset: metadata?.skip ?? pagination?.skip ?? 0,
      limit: metadata?.take ?? pagination?.take ?? 0,
    }
  }

  const { data: products, metadata } = await query.graph({
    entity: "product",
    fields,
    filters,
    pagination,
  })

  return {
    products,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  }
}
