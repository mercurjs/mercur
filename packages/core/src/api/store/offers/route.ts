import {
  MedusaResponse,
  MedusaStoreRequest,
} from "@medusajs/framework/http"

import {
  type EnrichableOffer,
  type LeadtimeOffer,
  splitComputedOfferFields,
  wrapOffersWithCalculatedPrices,
  wrapOffersWithEffectiveLeadtime,
  wrapOffersWithInventoryQuantityForSalesChannel,
  wrapOffersWithTaxPrices,
} from "./helpers"
import { StoreGetOffersParamsType } from "./validators"
import { getStoreOfferVisibility, listOffers } from "../../utils/list-offers"

export const GET = async (
  req: MedusaStoreRequest<StoreGetOffersParamsType>,
  res: MedusaResponse
) => {
  const { fields, withCalculatedPrice, withInventoryQuantity, withEffectiveLeadtime } =
    splitComputedOfferFields(req.queryConfig.fields)

  const { offers, count, estimate_count, offset, limit } = await listOffers<
    EnrichableOffer & LeadtimeOffer
  >(req.scope, {
    fields,
    filters: req.filterableFields,
    visibility: getStoreOfferVisibility(req.scope),
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

  if (withEffectiveLeadtime) {
    await wrapOffersWithEffectiveLeadtime(req, offers)
  }

  res.json({
    offers,
    count,
    ...(estimate_count !== undefined ? { estimate_count } : {}),
    offset,
    limit,
  })
}
