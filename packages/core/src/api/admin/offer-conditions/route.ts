import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { createOfferConditionsWorkflow } from "../../../workflows/offer"
import {
  AdminCreateOfferConditionType,
  AdminGetOfferConditionsParamsType,
} from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetOfferConditionsParamsType>,
  res: MedusaResponse<HttpTypes.AdminOfferConditionListResponse>
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

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateOfferConditionType>,
  res: MedusaResponse<HttpTypes.AdminOfferConditionResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { result } = await createOfferConditionsWorkflow(req.scope).run({
    input: { offer_conditions: [req.validatedBody] },
  })

  const {
    data: [offer_condition],
  } = await query.graph({
    entity: "offer_condition",
    fields: req.queryConfig.fields,
    filters: { id: result[0].id },
  })

  res.status(201).json({ offer_condition })
}
