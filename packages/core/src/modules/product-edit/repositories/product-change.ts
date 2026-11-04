import { SqlEntityManager } from "@medusajs/framework/mikro-orm/postgresql"
import { Context, FindOptions } from "@medusajs/framework/types"
import {
  DALUtils,
  FreeTextSearchFilterKeyPrefix,
  isObject,
} from "@medusajs/framework/utils"
import type { Knex } from "@medusajs/framework/mikro-orm/knex"
import {
  ProductChangeActionType,
  ProductChangeStatus,
  ProductStatus,
} from "@mercurjs/types"

import { ProductChange } from "../models"

const OPERATOR_MAP: Record<string, string> = {
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

const SORTABLE_COLUMNS: Record<string, string> = {
  created_at: "pc.created_at",
  updated_at: "pc.updated_at",
  product_title: "p.title",
  seller_name: "s.name",
}

const INBOX_TYPE_SQL = `
  CASE
    WHEN acts.is_add THEN 'new_product'
    WHEN acts.is_delete THEN 'delete'
    ELSE 'update'
  END
`

const normalizeDirection = (value: unknown): "ASC" | "DESC" | undefined => {
  if (typeof value !== "string") {
    return undefined
  }
  const upper = value.toUpperCase()
  return upper.startsWith("ASC")
    ? "ASC"
    : upper.startsWith("DESC")
      ? "DESC"
      : undefined
}

const toBindings = (value: unknown): Knex.RawBinding[] =>
  (Array.isArray(value) ? value : [value]) as Knex.RawBinding[]

export class ProductChangeRepository extends DALUtils.mikroOrmBaseRepositoryFactory(
  ProductChange
) {
  private pushFilter(
    column: string,
    value: unknown,
    whereClauses: string[],
    params: Knex.RawBinding[]
  ): void {
    if (!isObject(value)) {
      const values = toBindings(value)
      whereClauses.push(`${column} IN (${values.map(() => "?").join(",")})`)
      params.push(...values)
      return
    }

    for (const [operator, operand] of Object.entries(
      value as Record<string, unknown>
    )) {
      const sqlOperator = OPERATOR_MAP[operator]
      if (!sqlOperator) {
        continue
      }

      if (sqlOperator === "IN" || sqlOperator === "NOT IN") {
        const values = toBindings(operand)
        whereClauses.push(
          `${column} ${sqlOperator} (${values.map(() => "?").join(",")})`
        )
        params.push(...values)
      } else {
        whereClauses.push(`${column} ${sqlOperator} ?`)
        params.push(operand as Knex.RawBinding)
      }
    }
  }

  async findAndCount(
    options?: FindOptions<any>,
    sharedContext: Context = {}
  ): Promise<[any[], number]> {
    const findOptions = { ...options } as any
    findOptions.options ??= {}
    findOptions.where = { ...(findOptions.where ?? {}) }

    const filters = findOptions.where
    const inbox = filters.inbox === true
    delete filters.inbox

    if (!inbox) {
      return super.findAndCount(findOptions, sharedContext)
    }

    const orderBy = findOptions.options.orderBy ?? findOptions.options.order ?? {}
    const search =
      findOptions.options.filters?.[`${FreeTextSearchFilterKeyPrefix}ProductChange`]
        ?.value ?? filters.q
    const manager = this.getActiveManager<SqlEntityManager>(sharedContext)
    const knex = manager.getKnex()

    const params: Knex.RawBinding[] = [
      ProductChangeStatus.PENDING,
      ProductStatus.PROPOSED,
      ProductChangeActionType.CHANGE_REQUESTED,
    ]
    const whereClauses: string[] = [
      "pc.deleted_at IS NULL",
      `(
        pc.status = ?
        OR (
          acts.is_add
          AND p.status = ?
          AND NOT EXISTS (
            SELECT 1
            FROM product_change_action r
            JOIN product_change rc
              ON rc.id = r.product_change_id AND rc.deleted_at IS NULL
            WHERE r.product_id = pc.product_id
              AND r.deleted_at IS NULL
              AND r.action = ?
              AND rc.created_at = (
                SELECT MAX(lc.created_at)
                FROM product_change lc
                WHERE lc.product_id = pc.product_id AND lc.deleted_at IS NULL
              )
          )
        )
      )`,
    ]

    if (filters.id) {
      this.pushFilter("pc.id", filters.id, whereClauses, params)
    }
    if (filters.product_id) {
      this.pushFilter("pc.product_id", filters.product_id, whereClauses, params)
    }
    if (filters.seller_id) {
      this.pushFilter("s.id", filters.seller_id, whereClauses, params)
    }
    if (filters.type) {
      this.pushFilter(`(${INBOX_TYPE_SQL})`, filters.type, whereClauses, params)
    }
    if (filters.created_at) {
      this.pushFilter("pc.created_at", filters.created_at, whereClauses, params)
    }
    if (filters.updated_at) {
      this.pushFilter("pc.updated_at", filters.updated_at, whereClauses, params)
    }
    if (search) {
      const pattern = `%${String(search).trim()}%`
      whereClauses.push("(p.title ILIKE ? OR s.name ILIKE ? OR pc.product_id ILIKE ?)")
      params.push(pattern, pattern, pattern)
    }

    const orderByClauses: string[] = []
    for (const [key, column] of Object.entries(SORTABLE_COLUMNS)) {
      const direction = normalizeDirection(orderBy[key])
      if (direction) {
        orderByClauses.push(`${column} ${direction}`)
      }
    }
    if (orderByClauses.length === 0) {
      orderByClauses.push("pc.created_at DESC")
    }

    const fromClause = `
      FROM product_change pc
      JOIN seller s ON s.id = pc.created_by AND s.deleted_at IS NULL
      JOIN product p ON p.id = pc.product_id AND p.deleted_at IS NULL
      CROSS JOIN LATERAL (
        SELECT
          COUNT(*) AS action_count,
          COALESCE(bool_or(a.action = '${ProductChangeActionType.PRODUCT_ADD}'), false) AS is_add,
          COALESCE(bool_or(a.action = '${ProductChangeActionType.PRODUCT_DELETE}'), false) AS is_delete
        FROM product_change_action a
        WHERE a.product_change_id = pc.id AND a.deleted_at IS NULL
      ) acts
      WHERE ${whereClauses.join(" AND ")}
    `

    const countQuery = `SELECT COUNT(*) AS count ${fromClause}`

    let query = `
      SELECT
        pc.*,
        ${INBOX_TYPE_SQL} AS type,
        acts.action_count,
        p.title AS product_title,
        p.thumbnail AS product_thumbnail,
        p.status AS product_status,
        s.id AS seller_id,
        s.name AS seller_name,
        s.handle AS seller_handle
      ${fromClause}
      ORDER BY ${orderByClauses.join(", ")}
    `

    const paginationParams: Knex.RawBinding[] = []
    const take = findOptions.options.limit ?? findOptions.options.take
    const skip = findOptions.options.offset ?? findOptions.options.skip
    if (take) {
      query += " LIMIT ?"
      paginationParams.push(take)
    }
    if (skip) {
      query += " OFFSET ?"
      paginationParams.push(skip)
    }

    const [result, countResult] = await Promise.all([
      knex.raw(query, [...params, ...paginationParams]),
      knex.raw(countQuery, params),
    ])

    const rows = result.rows.map((row: Record<string, unknown>) => ({
      ...row,
      action_count: Number(row.action_count ?? 0),
    }))
    const count = parseInt(countResult.rows?.[0]?.count || "0", 10)

    return [rows, count]
  }
}
