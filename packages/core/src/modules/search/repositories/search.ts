import { SqlEntityManager } from "@medusajs/framework/mikro-orm/postgresql"

import {
  FacetParams,
  FacetResult,
  PriceRangeFacetBucket,
  SearchFilters,
  SearchParams,
  SearchResult,
  SearchResultProduct,
} from "../types"

type Knex = ReturnType<SqlEntityManager["getKnex"]>

type Binding = string | number

type WhereFragment = {
  sql: string
  bindings: Binding[]
}

type FilterDimension =
  | "category"
  | "collection"
  | "type"
  | "tag"
  | "seller"
  | "attributes"
  | "price"

const TS_CONFIG = "simple"

const toArray = (value: string | string[] | undefined): string[] => {
  if (value === undefined) {
    return []
  }
  return Array.isArray(value) ? value : [value]
}

const arrayLiteral = (values: string[], bindings: Binding[]): string => {
  const placeholders = values.map(() => "?").join(", ")
  bindings.push(...values)
  return `array[${placeholders}]::text[]`
}

/**
 * Builds the shared WHERE fragment for the `search_product sp` /
 * `search_product_price pr` join. `omit` drops a single dimension so facet
 * drill-down counts exclude the user's own selection on that dimension.
 */
const buildWhere = (
  params: { q?: string; filters?: SearchFilters },
  omit?: FilterDimension
): WhereFragment => {
  const filters = params.filters ?? {}
  const clauses: string[] = ["sp.deleted_at IS NULL", "sp.status = ?"]
  const bindings: Binding[] = ["published"]

  if (params.q) {
    clauses.push(`sp.search_tsv @@ websearch_to_tsquery('${TS_CONFIG}', ?)`)
    bindings.push(params.q)
  }

  if (omit !== "category" && filters.category_ids?.length) {
    clauses.push(
      `jsonb_exists_any(sp.category_ids, ${arrayLiteral(filters.category_ids, bindings)})`
    )
  }

  if (omit !== "collection") {
    const collections = toArray(filters.collection_id)
    if (collections.length) {
      clauses.push(`sp.collection_id = ANY(${arrayLiteral(collections, bindings)})`)
    }
  }

  if (omit !== "type") {
    const types = toArray(filters.type_id)
    if (types.length) {
      clauses.push(`sp.type_id = ANY(${arrayLiteral(types, bindings)})`)
    }
  }

  if (omit !== "tag" && filters.tag_ids?.length) {
    clauses.push(
      `jsonb_exists_any(sp.tag_ids, ${arrayLiteral(filters.tag_ids, bindings)})`
    )
  }

  if (omit !== "seller" && filters.seller_ids?.length) {
    clauses.push(
      `jsonb_exists_any(sp.seller_ids, ${arrayLiteral(filters.seller_ids, bindings)})`
    )
  }

  if (omit !== "attributes" && filters.attributes) {
    for (const [attributeId, values] of Object.entries(filters.attributes)) {
      if (!values.length) {
        continue
      }
      clauses.push(`jsonb_exists_any(sp.attributes -> ?, ${arrayLiteral(values, bindings)})`)
      bindings.splice(bindings.length - values.length, 0, attributeId)
    }
  }

  if (omit !== "price" && filters.price) {
    if (filters.price.gte !== undefined) {
      clauses.push("pr.max_amount >= ?")
      bindings.push(filters.price.gte)
    }
    if (filters.price.lte !== undefined) {
      clauses.push("pr.min_amount <= ?")
      bindings.push(filters.price.lte)
    }
  }

  return { sql: clauses.join(" AND "), bindings }
}

const priceJoin = (regionId: string): WhereFragment => ({
  sql: "LEFT JOIN search_product_price pr ON pr.product_id = sp.id AND pr.region_id = ? AND pr.deleted_at IS NULL",
  bindings: [regionId],
})

const requiresPriceRow = (filters?: SearchFilters, sortByPrice?: boolean): boolean =>
  Boolean(sortByPrice || filters?.price)

type ProductRow = {
  id: string
  product_id: string
  title: string
  handle: string
  description: string | null
  thumbnail: string | null
  status: string
  collection_id: string | null
  type_id: string | null
  category_ids: string[] | null
  tag_ids: string[] | null
  seller_ids: string[] | null
  attributes: Record<string, string[]> | null
  metadata: Record<string, unknown> | null
  pr_region_id: string | null
  pr_currency_code: string | null
  pr_min_amount: string | number | null
  pr_max_amount: string | number | null
}

const mapProduct = (row: ProductRow): SearchResultProduct => ({
  id: row.id,
  product_id: row.product_id,
  title: row.title,
  handle: row.handle,
  description: row.description,
  thumbnail: row.thumbnail,
  status: row.status,
  collection_id: row.collection_id,
  type_id: row.type_id,
  category_ids: row.category_ids ?? [],
  tag_ids: row.tag_ids ?? [],
  seller_ids: row.seller_ids ?? [],
  attributes: row.attributes ?? {},
  metadata: row.metadata,
  calculated_price:
    row.pr_region_id && row.pr_currency_code
      ? {
          region_id: row.pr_region_id,
          currency_code: row.pr_currency_code,
          min_amount: Number(row.pr_min_amount),
          max_amount: Number(row.pr_max_amount),
        }
      : null,
})

export const searchProducts = async (
  knex: Knex,
  params: SearchParams
): Promise<SearchResult> => {
  const join = priceJoin(params.region_id)
  const where = buildWhere(params)
  const sortByPrice = params.sort?.field === "price"
  const needsPriceRow = requiresPriceRow(params.filters, sortByPrice)

  const from = `FROM search_product sp ${join.sql} WHERE ${where.sql}${
    needsPriceRow ? " AND pr.id IS NOT NULL" : ""
  }`
  const baseBindings = [...join.bindings, ...where.bindings]

  const order = (() => {
    const dir = params.sort?.order === "asc" ? "ASC" : "DESC"
    if (params.sort?.field === "price") {
      return `ORDER BY pr.min_amount ${dir} NULLS LAST`
    }
    if (params.sort?.field === "relevance" && params.q) {
      return `ORDER BY ts_rank(sp.search_tsv, websearch_to_tsquery('${TS_CONFIG}', ?)) DESC`
    }
    if (params.q && !params.sort) {
      return `ORDER BY ts_rank(sp.search_tsv, websearch_to_tsquery('${TS_CONFIG}', ?)) DESC`
    }
    return `ORDER BY sp.created_at ${dir}`
  })()

  const orderBindings: Binding[] =
    order.includes("ts_rank") && params.q ? [params.q] : []

  const take = params.pagination?.take ?? 20
  const skip = params.pagination?.skip ?? 0

  const dataSql = `SELECT sp.id, sp.product_id, sp.title, sp.handle, sp.description, sp.thumbnail, sp.status, sp.collection_id, sp.type_id, sp.category_ids, sp.tag_ids, sp.seller_ids, sp.attributes, sp.metadata, pr.region_id AS pr_region_id, pr.currency_code AS pr_currency_code, pr.min_amount AS pr_min_amount, pr.max_amount AS pr_max_amount ${from} ${order} LIMIT ? OFFSET ?`

  const dataResult = await knex.raw(dataSql, [
    ...baseBindings,
    ...orderBindings,
    take,
    skip,
  ])

  const countSql = `SELECT count(*)::int AS count ${from}`
  const countResult = await knex.raw(countSql, baseBindings)

  const rows = (dataResult.rows ?? []) as ProductRow[]
  const count = Number(countResult.rows?.[0]?.count ?? 0)

  return { products: rows.map(mapProduct), count }
}

type FacetCountRow = { value: string; count: number }

const runFacet = async (
  knex: Knex,
  regionId: string,
  params: FacetParams,
  omit: FilterDimension,
  selectExpr: string,
  fromExtra: string,
  groupBy: string,
  extraWhere = ""
): Promise<FacetCountRow[]> => {
  const join = priceJoin(regionId)
  const where = buildWhere(params, omit)
  const needsPriceRow = omit !== "price" && Boolean(params.filters?.price)
  const sql = `SELECT ${selectExpr}, count(DISTINCT sp.id)::int AS count FROM search_product sp ${join.sql}${fromExtra} WHERE ${where.sql}${
    needsPriceRow ? " AND pr.id IS NOT NULL" : ""
  }${extraWhere} GROUP BY ${groupBy} ORDER BY count DESC`
  const result = await knex.raw(sql, [...join.bindings, ...where.bindings])
  return (result.rows ?? []) as FacetCountRow[]
}

export const computeFacets = async (
  knex: Knex,
  params: FacetParams
): Promise<FacetResult> => {
  const regionId = params.region_id

  const categories = await runFacet(
    knex,
    regionId,
    params,
    "category",
    "value",
    ", jsonb_array_elements_text(sp.category_ids) AS value",
    "value"
  )

  const collections = await runFacet(
    knex,
    regionId,
    params,
    "collection",
    "sp.collection_id AS value",
    "",
    "sp.collection_id",
    " AND sp.collection_id IS NOT NULL"
  )

  const types = await runFacet(
    knex,
    regionId,
    params,
    "type",
    "sp.type_id AS value",
    "",
    "sp.type_id",
    " AND sp.type_id IS NOT NULL"
  )

  const tags = await runFacet(
    knex,
    regionId,
    params,
    "tag",
    "value",
    ", jsonb_array_elements_text(sp.tag_ids) AS value",
    "value"
  )

  const attributeRows = (await (async () => {
    const join = priceJoin(regionId)
    const where = buildWhere(params, "attributes")
    const needsPriceRow = Boolean(params.filters?.price)
    const sql = `SELECT kv.key AS attr_id, val AS value, count(DISTINCT sp.id)::int AS count FROM search_product sp ${join.sql}, jsonb_each(sp.attributes) AS kv, jsonb_array_elements_text(kv.value) AS val WHERE ${where.sql}${
      needsPriceRow ? " AND pr.id IS NOT NULL" : ""
    } GROUP BY kv.key, val ORDER BY count DESC`
    const result = await knex.raw(sql, [...join.bindings, ...where.bindings])
    return (result.rows ?? []) as Array<{
      attr_id: string
      value: string
      count: number
    }>
  })())

  const attributes: FacetResult["attributes"] = {}
  for (const row of attributeRows) {
    if (!attributes[row.attr_id]) {
      attributes[row.attr_id] = []
    }
    attributes[row.attr_id].push({ value: row.value, count: Number(row.count) })
  }

  const price_ranges = await computePriceRangeFacets(knex, params)

  return {
    categories: categories.map((r) => ({ value: r.value, count: Number(r.count) })),
    collections: collections.map((r) => ({ value: r.value, count: Number(r.count) })),
    types: types.map((r) => ({ value: r.value, count: Number(r.count) })),
    tags: tags.map((r) => ({ value: r.value, count: Number(r.count) })),
    attributes,
    price_ranges,
  }
}

const computePriceRangeFacets = async (
  knex: Knex,
  params: FacetParams
): Promise<PriceRangeFacetBucket[]> => {
  const buckets = params.price_ranges ?? []
  if (!buckets.length) {
    return []
  }

  const join = priceJoin(params.region_id)
  const where = buildWhere(params, "price")

  const selects: string[] = []
  const bucketBindings: Binding[] = []
  buckets.forEach((bucket, index) => {
    const conds: string[] = []
    if (bucket.gte !== undefined) {
      conds.push("pr.max_amount >= ?")
      bucketBindings.push(bucket.gte)
    }
    if (bucket.lte !== undefined) {
      conds.push("pr.min_amount <= ?")
      bucketBindings.push(bucket.lte)
    }
    const cond = conds.length ? conds.join(" AND ") : "TRUE"
    selects.push(
      `(count(DISTINCT sp.id) FILTER (WHERE ${cond}))::int AS bucket_${index}`
    )
  })

  const sql = `SELECT ${selects.join(", ")} FROM search_product sp ${join.sql} WHERE ${where.sql} AND pr.id IS NOT NULL`
  const result = await knex.raw(sql, [
    ...bucketBindings,
    ...join.bindings,
    ...where.bindings,
  ])
  const row = (result.rows?.[0] ?? {}) as Record<string, number>

  return buckets.map((bucket, index) => ({
    gte: bucket.gte ?? null,
    lte: bucket.lte ?? null,
    count: Number(row[`bucket_${index}`] ?? 0),
  }))
}
