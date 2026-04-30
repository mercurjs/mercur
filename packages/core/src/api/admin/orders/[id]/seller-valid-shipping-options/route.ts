import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  QueryContext,
} from "@medusajs/framework/utils"

import { resolveOrderSeller } from "../../../helpers/resolve-order-seller"

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

type ShippingOptionRow = {
  id: string
  name: string
  service_zone_id?: string
  rules?: Array<{ attribute: string; value: string; operator: string }>
  prices?: Array<{ currency_code?: string; amount?: number }>
  calculated_price?: {
    calculated_amount?: number | null
    is_calculated_price_tax_inclusive?: boolean
  } | null
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

  // Pull order's currency + region so we can resolve calculated_price
  // for each candidate shipping option below. If calculated_price is
  // null for a given option (e.g. price config has rules that don't
  // satisfy the order's pricing context), Medusa's downstream
  // prepare-shipping-method workflow crashes with `Cannot read
  // properties of null (reading 'calculated_amount')` when the admin
  // selects it. We pre-resolve and drop those options here so the
  // picker only ever offers actionable values.
  const { data: orderRows } = await query.graph({
    entity: "order",
    fields: ["id", "currency_code", "region_id"],
    filters: { id },
  })
  const orderRow = orderRows[0] as
    | { currency_code?: string; region_id?: string | null }
    | undefined
  const orderCurrency = orderRow?.currency_code?.toLowerCase()
  const orderRegionId = orderRow?.region_id ?? undefined

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

  const pricingContext: Record<string, unknown> = {}
  if (orderCurrency) {
    pricingContext.currency_code = orderCurrency
  }
  if (orderRegionId) {
    pricingContext.region_id = orderRegionId
  }

  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: [
      "id",
      "name",
      "price_type",
      "provider_id",
      "service_zone_id",
      "service_zone.fulfillment_set.location.id",
      "service_zone.fulfillment_set.location.name",
      "service_zone.fulfillment_set.location.address.*",
      "rules.attribute",
      "rules.value",
      "rules.operator",
      "prices.currency_code",
      "prices.amount",
      "calculated_price.calculated_amount",
      "calculated_price.is_calculated_price_tax_inclusive",
    ],
    filters: { id: sellerOptionIds },
    context: {
      calculated_price: QueryContext(pricingContext),
    },
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
    // Drop options where Medusa pricing module couldn't resolve a
    // calculated_amount for the order's pricing context — selecting
    // such an option would crash prepare-shipping-method downstream.
    if (
      opt.calculated_price?.calculated_amount === undefined ||
      opt.calculated_price?.calculated_amount === null
    ) {
      return false
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
