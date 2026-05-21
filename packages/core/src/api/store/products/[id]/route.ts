import {
  MedusaResponse,
  MedusaStoreRequest,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { wrapVariantsWithOffersInventory } from "../../../utils/wrap-variants-with-offers-inventory"
import { wrapVariantsWithOffersPrices } from "../../../utils/wrap-variants-with-offers-prices"
import {
  OFFER_CALCULATED_PRICE_FIELD,
  OFFER_INVENTORY_QUANTITY_FIELD,
} from "../query-config"

export const GET = async (req: MedusaStoreRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // `applyVisibleSellerIdsFilter` + `maybeApplyLinkFilter` resolves the
  // visible product set onto `req.filterableFields.id`. The URL id must be
  // a member of that set; otherwise the seller-visibility constraint is
  // bypassed and a suspended/closed seller's product would leak through.
  const visibleIds = (req.filterableFields as { id?: unknown }).id
  if (Array.isArray(visibleIds) && !visibleIds.includes(req.params.id)) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${req.params.id} was not found`,
    )
  }

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

  // region_id / currency_code are consumed by setPricingContext only —
  // the Product entity has neither column, so passing them through
  // raises `Trying to query by not existing property Product.region_id`.
  const {
    region_id: _r,
    currency_code: _c,
    ...productFilters
  } = (req.filterableFields ?? {}) as Record<string, unknown>

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: { ...productFilters, id: req.params.id },
  })

  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${req.params.id} was not found`,
    )
  }

  const variants = ((product as { variants?: unknown[] }).variants ??
    []) as Array<{ id: string }>

  if (withCalculatedPrice) {
    await wrapVariantsWithOffersPrices(req, variants)
  }

  if (withInventoryQuantity) {
    await wrapVariantsWithOffersInventory(req, variants)
  }

  res.json({ product })
}
