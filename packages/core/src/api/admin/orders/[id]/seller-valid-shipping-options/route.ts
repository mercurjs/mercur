import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { resolveOrderSeller } from "../../../helpers/resolve-order-seller"

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

type ShippingOptionRow = {
  id: string
  name: string
  service_zone_id?: string
  rules?: Array<{ attribute: string; value: string; operator: string }>
}

const isReturnOption = (option: ShippingOptionRow): boolean => {
  const rule = option.rules?.find((r) => r.attribute === "is_return")
  return rule?.value === "true"
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params as { id: string }
  const locationId = String(req.query.location_id ?? "")
  const isReturn = String(req.query.is_return ?? "false") === "true"
  const limit = Math.min(
    Number(req.query.limit ?? DEFAULT_LIMIT),
    MAX_LIMIT
  )
  const offset = Number(req.query.offset ?? 0)

  const { seller_id } = await resolveOrderSeller(req.scope, id)

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Resolve seller-owned shipping option ids via the link table.
  const { data: links } = await query.graph({
    entity: "shipping_option_seller",
    fields: ["shipping_option_id"],
    filters: { seller_id },
  })
  const sellerOptionIds = (
    links as Array<{ shipping_option_id: string }>
  ).map((l) => l.shipping_option_id)

  if (sellerOptionIds.length === 0) {
    res.status(200).json({
      shipping_options: [],
      count: 0,
      limit,
      offset,
    })
    return
  }

  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: [
      "id",
      "name",
      "price_type",
      "provider_id",
      "service_zone_id",
      "rules.attribute",
      "rules.value",
      "rules.operator",
    ],
    filters: { id: sellerOptionIds },
  })

  // Resolve fulfillment_set ids bound to the requested location so we can
  // filter shipping options by location without deep-graph traversal.
  let fulfillmentSetIdsForLocation: Set<string> | null = null
  if (locationId) {
    const { data: locationLinks } = await query.graph({
      entity: "location_fulfillment_set",
      fields: ["fulfillment_set_id"],
      filters: { stock_location_id: locationId },
    })
    fulfillmentSetIdsForLocation = new Set(
      (
        locationLinks as Array<{ fulfillment_set_id: string }>
      ).map((l) => l.fulfillment_set_id)
    )
  }

  const serviceZoneIds = (options as ShippingOptionRow[])
    .map((o) => o.service_zone_id)
    .filter((id): id is string => !!id)

  let serviceZoneToFulfillmentSet: Map<string, string> = new Map()
  if (serviceZoneIds.length > 0) {
    const { data: serviceZones } = await query.graph({
      entity: "service_zone",
      fields: ["id", "fulfillment_set_id"],
      filters: { id: Array.from(new Set(serviceZoneIds)) },
    })
    serviceZoneToFulfillmentSet = new Map(
      (
        serviceZones as Array<{
          id: string
          fulfillment_set_id: string
        }>
      ).map((sz) => [sz.id, sz.fulfillment_set_id])
    )
  }

  const filtered = (options as ShippingOptionRow[]).filter((opt) => {
    if (isReturnOption(opt) !== isReturn) return false
    if (fulfillmentSetIdsForLocation) {
      const fulfillmentSetId = opt.service_zone_id
        ? serviceZoneToFulfillmentSet.get(opt.service_zone_id)
        : undefined
      if (
        !fulfillmentSetId ||
        !fulfillmentSetIdsForLocation.has(fulfillmentSetId)
      ) {
        return false
      }
    }
    return true
  })

  const page = filtered.slice(offset, offset + limit)

  res.status(200).json({
    shipping_options: page,
    count: filtered.length,
    limit,
    offset,
  })
}
