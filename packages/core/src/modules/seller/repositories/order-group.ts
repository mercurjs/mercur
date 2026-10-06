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

// SQL twin of `getLastPaymentStatus` in workflows/order-group/utils, applied
// to the collections `resolveOrderPaymentCollections` picks for an order: its
// own collections when the cart payment was split into them, otherwise the
// shared cart collection. Keep the three in sync.
const ORDER_PAYMENT_STATUS_JOIN = `
  LEFT JOIN currency fo_currency ON fo_currency.code = fo.currency_code
  CROSS JOIN LATERAL (
    WITH own AS (
      SELECT pc.amount, pc.captured_amount, pc.refunded_amount, pc.status
      FROM order_payment_collection opc
      JOIN payment_collection pc
        ON pc.id = opc.payment_collection_id AND pc.deleted_at IS NULL
      WHERE opc.order_id = fo.id AND opc.deleted_at IS NULL
    ),
    cart_pc AS (
      SELECT pc.amount, pc.captured_amount, pc.refunded_amount, pc.status,
        COALESCE(pc.metadata->>'split_order_collections', '') = 'true' AS is_split
      FROM order_cart oc
      JOIN cart_payment_collection cpc
        ON cpc.cart_id = oc.cart_id AND cpc.deleted_at IS NULL
      JOIN payment_collection pc
        ON pc.id = cpc.payment_collection_id AND pc.deleted_at IS NULL
      WHERE oc.order_id = fo.id AND oc.deleted_at IS NULL
      LIMIT 1
    ),
    resolved AS (
      SELECT amount, captured_amount, refunded_amount, status FROM own
      WHERE NOT EXISTS (SELECT 1 FROM cart_pc WHERE NOT is_split)
      UNION ALL
      SELECT amount, captured_amount, refunded_amount, status FROM cart_pc
      WHERE NOT (is_split AND EXISTS (SELECT 1 FROM own))
    ),
    scored AS (
      SELECT
        status,
        CASE
          WHEN captured_amount > 0 OR amount = 0 THEN
            CASE WHEN amount - COALESCE(captured_amount, 0)
              <= power(10::numeric, -COALESCE(fo_currency.decimal_digits, 2))
            THEN 1 ELSE 0.5 END
          ELSE 0
        END AS captured,
        CASE
          WHEN refunded_amount > 0 THEN
            CASE WHEN amount - refunded_amount
              <= power(10::numeric, -COALESCE(fo_currency.decimal_digits, 2))
            THEN 1 ELSE 0.5 END
          ELSE 0
        END AS refunded,
        (status = 'captured' AND (captured_amount > 0 OR amount = 0))
          OR (status = 'refunded' AND refunded_amount > 0) AS amount_derived
      FROM resolved
    ),
    agg AS (
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(captured), 0)
          + COUNT(*) FILTER (WHERE NOT amount_derived AND status = 'captured') AS captured,
        COALESCE(SUM(refunded), 0)
          + COUNT(*) FILTER (WHERE NOT amount_derived AND status = 'refunded') AS refunded,
        COUNT(*) FILTER (WHERE NOT amount_derived AND status = 'requires_action') AS requires_action,
        COUNT(*) FILTER (WHERE NOT amount_derived AND status = 'authorized') AS authorized,
        COUNT(*) FILTER (WHERE NOT amount_derived AND status = 'canceled') AS canceled,
        COUNT(*) FILTER (WHERE NOT amount_derived AND status = 'awaiting') AS awaiting
      FROM scored
    )
    SELECT CASE
      WHEN requires_action > 0 THEN 'requires_action'
      WHEN refunded > 0 THEN
        CASE WHEN refunded = captured THEN 'refunded' ELSE 'partially_refunded' END
      WHEN captured > 0 THEN
        CASE WHEN captured = total - canceled THEN 'captured' ELSE 'partially_captured' END
      WHEN authorized > 0 THEN
        CASE WHEN authorized = total - canceled THEN 'authorized' ELSE 'partially_authorized' END
      WHEN canceled > 0 AND canceled = total THEN 'canceled'
      WHEN awaiting > 0 THEN 'awaiting'
      ELSE 'not_paid'
    END AS payment_status
    FROM agg
  ) fo_payment
`

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

    let needsPaymentStatus = false
    if (filters.payment_status) {
      const paymentStatuses = Array.isArray(filters.payment_status)
        ? filters.payment_status
        : [filters.payment_status]
      const placeholders = paymentStatuses.map(() => "?").join(",")
      orderClauses.push(`fo_payment.payment_status IN (${placeholders})`)
      orderParams.push(...paymentStatuses)
      needsPaymentStatus = true
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
        ${needsPaymentStatus ? ORDER_PAYMENT_STATUS_JOIN : ""}
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