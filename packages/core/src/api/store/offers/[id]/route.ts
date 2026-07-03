import {
  MedusaResponse,
  MedusaStoreRequest,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import {
  splitComputedOfferFields,
  wrapOffersWithCalculatedPrices,
  wrapOffersWithInventoryQuantityForSalesChannel,
  wrapOffersWithTaxPrices,
} from "../helpers"
import { StoreGetOfferParamsType } from "../validators"

export const GET = async (
  req: MedusaStoreRequest<StoreGetOfferParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { fields, withCalculatedPrice, withInventoryQuantity } =
    splitComputedOfferFields(req.queryConfig.fields)

  const {
    data: [offer],
  } = await query.graph({
    entity: "offer",
    fields: fields,
    filters: { ...req.filterableFields, id: req.params.id },
  })

  if (!offer) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Offer with id ${req.params.id} was not found`
    )
  }

  const offers = [offer]
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

  res.json({ offer })
}
