import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { VendorGetOfferConditionsParamsType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<VendorGetOfferConditionsParamsType>,
  res: MedusaResponse<HttpTypes.VendorOfferConditionListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: offer_conditions, metadata } = await query.graph({
    entity: "offer_condition",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    offer_conditions,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
