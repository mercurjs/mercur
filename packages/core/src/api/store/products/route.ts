import {
  MedusaResponse,
  MedusaStoreRequest,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { wrapVariantsWithOffersInventory } from "../../utils/wrap-variants-with-offers-inventory"
import { wrapVariantsWithOffersPrices } from "../../utils/wrap-variants-with-offers-prices"
import {
  OFFER_CALCULATED_PRICE_FIELD,
  OFFER_INVENTORY_QUANTITY_FIELD,
} from "./query-config"

export const GET = async (req: MedusaStoreRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const withCalculatedPrice = req.queryConfig.fields.some((field) =>
    field.includes(OFFER_CALCULATED_PRICE_FIELD),
  )
  const withInventoryQuantity = req.queryConfig.fields.some((field) =>
    field.includes(OFFER_INVENTORY_QUANTITY_FIELD),
  )

  if (withCalculatedPrice || withInventoryQuantity) {
    req.queryConfig.fields = req.queryConfig.fields.filter(
      (field) =>
        !field.includes(OFFER_CALCULATED_PRICE_FIELD) &&
        !field.includes(OFFER_INVENTORY_QUANTITY_FIELD),
    )
  }

  // region_id / currency_code are consumed by setPricingContext only.
  // The Product entity has neither column, so passing them through to
  // query.graph raises `Trying to query by not existing property
  // Product.region_id`.
  const {
    region_id: _r,
    currency_code: _c,
    ...productFilters
  } = (req.filterableFields ?? {}) as Record<string, unknown>

  const { data: products, metadata } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: productFilters,
    pagination: req.queryConfig.pagination,
  })

  const variants = (products ?? [])
    .flatMap((p: { variants?: unknown[] }) => p.variants ?? [])
    .filter(Boolean) as Array<{ id: string }>

  if (withCalculatedPrice) {
    await wrapVariantsWithOffersPrices(req, variants)
  }

  if (withInventoryQuantity) {
    await wrapVariantsWithOffersInventory(req, variants)
  }

  res.json({
    products,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
