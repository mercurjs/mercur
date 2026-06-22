import {
  MedusaResponse,
  MedusaStoreRequest,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import {
  splitComputedOfferFields,
  wrapOffersWithCalculatedPrices,
  wrapOffersWithInventoryQuantityForSalesChannel,
  wrapOffersWithTaxPrices,
} from "./helpers"
import { StoreGetOffersParamsType } from "./validators"

export const GET = async (
  req: MedusaStoreRequest<StoreGetOffersParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { fields, withCalculatedPrice, withInventoryQuantity } =
    splitComputedOfferFields(req.queryConfig.fields)

  const { data: offers, metadata } = await query.graph({
    entity: "offer",
    fields: fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  if (withCalculatedPrice) {
    await wrapOffersWithCalculatedPrices(
      req,
      offers
    )
    await wrapOffersWithTaxPrices(req, offers)
  }

  if (withInventoryQuantity) {
    await wrapOffersWithInventoryQuantityForSalesChannel(req, offers)
  }

  res.json({
    offers,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
