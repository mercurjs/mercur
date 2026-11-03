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
  wrapOffersWithEffectiveLeadtime,
  wrapOffersWithInventoryQuantityForSalesChannel,
  wrapOffersWithTaxPrices,
} from "../helpers"
import { StoreGetOfferParamsType } from "../validators"
import { isOfferVisibleInStore } from "../../../utils/list-offers"

export const GET = async (
  req: MedusaStoreRequest<StoreGetOfferParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { fields, withCalculatedPrice, withInventoryQuantity, withEffectiveLeadtime } =
    splitComputedOfferFields(req.queryConfig.fields)

  const [
    {
      data: [offer],
    },
    {
      data: [visibility],
    },
  ] = await Promise.all([
    query.graph({
      entity: "offer",
      fields: fields,
      filters: { ...req.filterableFields, id: req.params.id },
    }),
    query.graph({
      entity: "offer",
      fields: [
        "id",
        "seller.status",
        "seller.closed_from",
        "seller.closed_to",
        "product.status",
      ],
      filters: { id: req.params.id },
    }),
  ])

  if (!offer || !visibility || !isOfferVisibleInStore(visibility)) {
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

  if (withEffectiveLeadtime) {
    await wrapOffersWithEffectiveLeadtime(req, offers)
  }

  res.json({ offer })
}
