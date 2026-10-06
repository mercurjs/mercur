import { SqlEntityManager } from "@medusajs/framework/mikro-orm/postgresql"
import { Context, FindOptions } from "@medusajs/framework/types"
import { DALUtils, isObject } from "@medusajs/framework/utils"
import { OrderGroup } from "../models"

const OPERATOR_MAP = {
  $eq: "=",
  $lt: "<",
  $gt: ">",
  $lte: "<=",
  $gte: ">=",
  $ne: "!=",
  $in: "IN",
  $nin: "NOT IN",
  $like: "LIKE",
  $ilike: "ILIKE",
}

const SORTABLE_COLUMNS = ["display_id", "created_at", "updated_at"] as const

const normalizeDirection = (value: unknown): "ASC" | "DESC" | undefined => {
  if (typeof value !== "string") {
    return undefined
  }
  const upper = value.toUpperCase()
  return upper.startsWith("ASC") ? "ASC" : upper.startsWith("DESC") ? "DESC" : undefined
}

export class OrderGroupRepository extends DALUtils.mikroOrmBaseRepositoryFactory(
  OrderGroup
) {
  private parseFilterValue(
    column: string,
    value: any,
    whereClauses: string[],
    params: any[]
  ): void {
    if (!isObject(value)) {
      if (Array.isArray(value)) {
        const placeholders = value.map(() => "?").join(",")
        whereClauses.push(`${column} IN (${placeholders})`)
        params.push(...value)
      } else {
        whereClauses.push(`${column} = ?`)
        params.push(value)
      }
      return
    }

    for (const [operator, operand] of Object.entries(value)) {
      const sqlOperator = OPERATOR_MAP[operator]
      if (!sqlOperator) {
        continue
      }

      if (sqlOperator === "IN" || sqlOperator === "NOT IN") {
        const values = Array.isArray(operand) ? operand : [operand]
        const placeholders = values.map(() => "?").join(",")
        whereClauses.push(`${column} ${sqlOperator} (${placeholders})`)
        params.push(...values)
      } else {
        whereClauses.push(`${column} ${sqlOperator} ?`)
        params.push(operand)
      }
    }
  }

  async findAndCount(
    options?: FindOptions<any>,
    sharedContext: Context = {}
  ): Promise<[any[], number]> {
    const findOptions_ = { ...options } as any
    findOptions_.options ??= {}
    findOptions_.where ??= {}

    const filters = findOptions_.where
    const orderBy = findOptions_.options.order || {}

    const manager = this.getActiveManager<SqlEntityManager>(sharedContext)
    const knex = manager.getKnex()

    const params: any[] = []
    const whereClauses: string[] = ["og.deleted_at IS NULL"]
    const orderParams: any[] = []
    const orderClauses: string[] = []

    if (filters.id) {
      const ids = Array.isArray(filters.id) ? filters.id : [filters.id]
      const placeholders = ids.map(() => "?").join(",")
      whereClauses.push(`og.id IN (${placeholders})`)
      params.push(...ids)
    }

    if (filters.customer_id) {
      const customerIds = Array.isArray(filters.customer_id)
        ? filters.customer_id
        : [filters.customer_id]
      const placeholders = customerIds.map(() => "?").join(",")
      whereClauses.push(`og.customer_id IN (${placeholders})`)
      params.push(...customerIds)
    }

    if (filters.cart_id) {
      const cartIds = Array.isArray(filters.cart_id)
        ? filters.cart_id
        : [filters.cart_id]
      const placeholders = cartIds.map(() => "?").join(",")
      whereClauses.push(`og.cart_id IN (${placeholders})`)
      params.push(...cartIds)
    }

    if (filters.seller_id) {
      const sellerIds = Array.isArray(filters.seller_id)
        ? filters.seller_id
        : [filters.seller_id]
      const placeholders = sellerIds.map(() => "?").join(",")
      orderClauses.push(`fo_seller.seller_id IN (${placeholders})`)
      orderParams.push(...sellerIds)
    }

    if (filters.status) {
      const statuses = Array.isArray(filters.status)
        ? filters.status
        : [filters.status]
      const placeholders = statuses.map(() => "?").join(",")
      orderClauses.push(`fo.status IN (${placeholders})`)
      orderParams.push(...statuses)
    }

    if (filters.sales_channel_id) {
      const salesChannelIds = Array.isArray(filters.sales_channel_id)
        ? filters.sales_channel_id
        : [filters.sales_channel_id]
      const placeholders = salesChannelIds.map(() => "?").join(",")
      orderClauses.push(`fo.sales_channel_id IN (${placeholders})`)
      orderParams.push(...salesChannelIds)
    }

    if (filters.created_at) {
      this.parseFilterValue("og.created_at", filters.created_at, whereClauses, params)
    }

    if (filters.updated_at) {
      this.parseFilterValue("og.updated_at", filters.updated_at, whereClauses, params)
    }

    if (filters.q) {
      whereClauses.push("(og.id ILIKE ? OR og.customer_id ILIKE ?)")
      const searchPattern = `%${filters.q}%`
      params.push(searchPattern, searchPattern)
    }

    // Order-level filters only decide which groups match. The aggregates below
    // must still span every order in the group, so those filters live in an
    // EXISTS subquery instead of the join the aggregates run over.
    if (orderClauses.length > 0) {
      whereClauses.push(`EXISTS (
        SELECT 1
        FROM order_group_order fogo
        JOIN "order" fo ON fo.id = fogo.order_id
        LEFT JOIN order_order_seller_seller fo_seller ON fo_seller.order_id = fo.id
        WHERE fogo.order_group_id = og.id AND ${orderClauses.join(" AND ")}
      )`)
      params.push(...orderParams)
    }

    const orderByClauses: string[] = []
    for (const column of SORTABLE_COLUMNS) {
      const direction = normalizeDirection(orderBy[column])
      if (direction) {
        orderByClauses.push(`og.${column} ${direction}`)
      }
    }
    if (orderByClauses.length === 0) {
      orderByClauses.push("og.created_at DESC")
    }

    const whereClause = whereClauses.join(" AND ")

    const countQuery = `
      SELECT COUNT(*) as count
      FROM order_group og
      WHERE ${whereClause}
    `

    let query = `
      SELECT
        og.*,
        COUNT(DISTINCT oso.seller_id) as seller_count,
        COALESCE(SUM((os.totals->>'current_order_total')::numeric), 0) as total
      FROM order_group og
      LEFT JOIN order_group_order ogo ON ogo.order_group_id = og.id
      LEFT JOIN "order" o ON o.id = ogo.order_id
      LEFT JOIN order_summary os ON os.order_id = o.id AND os.version = o.version
      LEFT JOIN order_order_seller_seller oso ON oso.order_id = o.id
      WHERE ${whereClause}
      GROUP BY og.id
      ORDER BY ${orderByClauses.join(", ")}
    `

    const paginationParams: any[] = []

    if (findOptions_.options.take) {
      query += " LIMIT ?"
      paginationParams.push(findOptions_.options.take)
    }
    if (findOptions_.options.skip) {
      query += " OFFSET ?"
      paginationParams.push(findOptions_.options.skip)
    }

    const [result, countResult] = await Promise.all([
      knex.raw(query, [...params, ...paginationParams]),
      knex.raw(countQuery, params),
    ])

    const rows = result.rows.map(row => ({
      ...row,
      total: row.total ? Number(row.total) : 0,
      seller_count: row.seller_count ? Number(row.seller_count) : 0,
    })) ?? []
    const count = parseInt(countResult.rows?.[0]?.count || "0", 10)

    return [rows, count]
  }
}