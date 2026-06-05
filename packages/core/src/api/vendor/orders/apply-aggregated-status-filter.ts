import {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import {
  getLastFulfillmentStatus,
  getLastPaymentStatus,
  OrderForStatusAggregation,
} from "./aggregate-status"

const toArray = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null) return undefined
  return Array.isArray(value) ? (value as string[]) : [value as string]
}

const extractIdList = (id: unknown): string[] | undefined => {
  if (id === undefined || id === null) return undefined
  if (Array.isArray(id)) return id as string[]
  if (typeof id === "string") return [id]
  if (typeof id === "object" && id !== null) {
    const $in = (id as { $in?: unknown }).$in
    if (Array.isArray($in)) return $in as string[]
  }
  return undefined
}

/**
 * Push `payment_status` / `fulfillment_status` from the request into
 * a precise `id` filter the orders workflow can paginate against.
 *
 * The Medusa `getOrdersListWorkflow` aggregates these statuses
 * post-query in JavaScript — passing them as `variables.filters` to
 * the workflow either 500s in mikro-orm (when the value shape
 * doesn't match a column) or silently no-ops. To keep filtering
 * server-side AND keep pagination correct, we resolve the candidate
 * orders (already scoped to the seller by `applySellerLinkFilter`),
 * aggregate each candidate's status with the same logic Medusa uses,
 * then intersect the surviving order IDs into the `id` filter.
 */
export const applyAggregatedStatusFilter = async (
  req: MedusaRequest,
  _: MedusaResponse,
  next: MedusaNextFunction
) => {
  const filterableFields = req.filterableFields ?? {}
  const paymentStatusFilter = toArray(filterableFields.payment_status)
  const fulfillmentStatusFilter = toArray(filterableFields.fulfillment_status)

  if (!paymentStatusFilter && !fulfillmentStatusFilter) {
    return next()
  }

  delete filterableFields.payment_status
  delete filterableFields.fulfillment_status

  const candidateIds = extractIdList(filterableFields.id)

  if (candidateIds && candidateIds.length === 0) {
    req.filterableFields = filterableFields
    return next()
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "currency_code",
      "payment_collections.status",
      "payment_collections.amount",
      "payment_collections.captured_amount",
      "payment_collections.refunded_amount",
      "fulfillments.canceled_at",
      "fulfillments.delivered_at",
      "fulfillments.shipped_at",
      "fulfillments.packed_at",
      "items.raw_quantity",
      "items.detail.raw_fulfilled_quantity",
    ],
    filters: candidateIds ? { id: candidateIds } : undefined,
  })

  const matchingIds = (
    orders as Array<OrderForStatusAggregation & { id: string }>
  )
    .filter((o) => {
      if (paymentStatusFilter) {
        const status = getLastPaymentStatus(o)
        if (!paymentStatusFilter.includes(status)) return false
      }
      if (fulfillmentStatusFilter) {
        const status = getLastFulfillmentStatus(o)
        if (!fulfillmentStatusFilter.includes(status)) return false
      }
      return true
    })
    .map((o) => o.id)

  const existingId = filterableFields.id

  if (matchingIds.length === 0) {
    filterableFields.id = { $in: [""] }
  } else if (existingId !== undefined) {
    filterableFields.$and = [
      { id: existingId },
      { id: { $in: matchingIds } },
    ]
    delete filterableFields.id
  } else {
    filterableFields.id = { $in: matchingIds }
  }

  req.filterableFields = filterableFields

  return next()
}
