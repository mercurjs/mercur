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

const VISIBILITY_FIELDS = [
  "seller.status",
  "seller.closed_from",
  "seller.closed_to",
  "product.status",
]

export const GET = async (
  req: MedusaStoreRequest<StoreGetOfferParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { fields, withCalculatedPrice, withInventoryQuantity, withEffectiveLeadtime } =
    splitComputedOfferFields(req.queryConfig.fields)

  const {
    data: [offer],
  } = await query.graph({
    entity: "offer",
    fields: Array.from(new Set([...fields, ...VISIBILITY_FIELDS])),
    filters: { ...req.filterableFields, id: req.params.id },
  })

  if (!offer || !isOfferVisibleInStore(offer)) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Offer with id ${req.params.id} was not found`
    )
  }

  for (const path of VISIBILITY_FIELDS) {
    const [relation, column] = path.split(".")
    if (fields.some((field) => field === relation || field.startsWith(`${relation}.`))) {
      if (!fields.includes(path) && !fields.includes(`${relation}.*`)) {
        delete offer[relation]?.[column]
      }
    } else {
      delete offer[relation]
    }
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
