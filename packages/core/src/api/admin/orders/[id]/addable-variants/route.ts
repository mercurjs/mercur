import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { resolveOrderSeller } from "../../../helpers/resolve-order-seller"

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

type VariantRow = {
  id: string
  sku?: string | null
  title?: string | null
  manage_inventory?: boolean
  prices?: Array<{ currency_code?: string; amount?: number }>
  inventory_items?: Array<{
    inventory?: {
      location_levels?: Array<{
        location_id?: string
        stocked_quantity?: number
        reserved_quantity?: number
      }>
    }
  }>
}

type Eligibility =
  | { can_add: true; reason: "ok" }
  | { can_add: false; reason: "no_price" | "no_inventory" }

const hasValidPrice = (
  variant: VariantRow,
  currencyCode: string
): boolean => {
  return (variant.prices ?? []).some(
    (p) =>
      typeof p?.currency_code === "string" &&
      p.currency_code.toLowerCase() === currencyCode.toLowerCase()
  )
}

const hasAvailableInventory = (
  variant: VariantRow,
  sellerLocationIds: Set<string>
): boolean => {
  // Non-managed inventory = always available (no stock tracked).
  if (variant.manage_inventory !== true) {
    return true
  }

  const items = variant.inventory_items ?? []
  for (const item of items) {
    const levels = item.inventory?.location_levels ?? []
    for (const level of levels) {
      if (
        level.location_id &&
        sellerLocationIds.has(level.location_id) &&
        (level.stocked_quantity ?? 0) >
          (level.reserved_quantity ?? 0)
      ) {
        return true
      }
    }
  }
  return false
}

const classify = (
  variant: VariantRow,
  currencyCode: string,
  sellerLocationIds: Set<string>
): Eligibility => {
  if (!hasValidPrice(variant, currencyCode)) {
    return { can_add: false, reason: "no_price" }
  }
  if (!hasAvailableInventory(variant, sellerLocationIds)) {
    return { can_add: false, reason: "no_inventory" }
  }
  return { can_add: true, reason: "ok" }
}

const matchesSearch = (variant: VariantRow, term: string): boolean => {
  const needle = term.toLowerCase()
  return (
    (variant.sku?.toLowerCase().includes(needle) ?? false) ||
    (variant.title?.toLowerCase().includes(needle) ?? false)
  )
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params as { id: string }
  const search = String(req.query.search ?? "")
  const limit = Math.min(
    Number(req.query.limit ?? DEFAULT_LIMIT),
    MAX_LIMIT
  )
  const offset = Number(req.query.offset ?? 0)

  const { seller_id } = await resolveOrderSeller(req.scope, id)

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Pull the order's currency for price eligibility.
  const { data: orderRows } = await query.graph({
    entity: "order",
    fields: ["id", "currency_code"],
    filters: { id },
  })
  const order = orderRows[0] as
    | { currency_code?: string }
    | undefined
  const currencyCode = order?.currency_code ?? ""

  // Seller-owned product ids.
  const { data: productLinks } = await query.graph({
    entity: "product_seller",
    fields: ["product_id"],
    filters: { seller_id },
  })
  const sellerProductIds = (
    productLinks as Array<{ product_id: string }>
  ).map((l) => l.product_id)

  if (sellerProductIds.length === 0) {
    res.status(200).json({
      variants: [],
      count: 0,
      limit,
      offset,
    })
    return
  }

  // Seller-valid stock location ids — inventory must be reachable from one.
  const { data: locationLinks } = await query.graph({
    entity: "stock_location_seller",
    fields: ["stock_location_id"],
    filters: { seller_id },
  })
  const sellerLocationIds = new Set(
    (
      locationLinks as Array<{ stock_location_id: string }>
    ).map((l) => l.stock_location_id)
  )

  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: [
      "id",
      "sku",
      "title",
      "manage_inventory",
      "product.id",
      "product.title",
      "product.thumbnail",
      "product.handle",
      "prices.currency_code",
      "prices.amount",
      "inventory_items.inventory.location_levels.location_id",
      "inventory_items.inventory.location_levels.stocked_quantity",
      "inventory_items.inventory.location_levels.reserved_quantity",
    ],
    filters: { product_id: sellerProductIds },
  })

  let rows = (variants as VariantRow[]).map((v) => ({
    ...v,
    eligibility: classify(v, currencyCode, sellerLocationIds),
  }))

  if (search.length > 0) {
    rows = rows.filter((v) => matchesSearch(v, search))
  }

  const page = rows.slice(offset, offset + limit)

  res.status(200).json({
    variants: page,
    count: rows.length,
    limit,
    offset,
  })
}
