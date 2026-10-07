import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import {
  deleteOfferConditionsWorkflow,
  updateOfferConditionsWorkflow,
} from "../../../../workflows/offer"
import { AdminUpdateOfferConditionType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminOfferConditionResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [offer_condition],
  } = await query.graph({
    entity: "offer_condition",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  if (!offer_condition) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Offer condition with id ${req.params.id} was not found`
    )
  }

  res.json({ offer_condition })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateOfferConditionType>,
  res: MedusaResponse<HttpTypes.AdminOfferConditionResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [existing],
  } = await query.graph({
    entity: "offer_condition",
    fields: ["id"],
    filters: { id: req.params.id },
  })

  if (!existing) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Offer condition with id ${req.params.id} was not found`
    )
  }

  await updateOfferConditionsWorkflow(req.scope).run({
    input: { offer_conditions: [{ id: req.params.id, ...req.validatedBody }] },
  })

  const {
    data: [offer_condition],
  } = await query.graph({
    entity: "offer_condition",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  res.json({ offer_condition })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminOfferConditionDeleteResponse>
) => {
  await deleteOfferConditionsWorkflow(req.scope).run({
    input: { ids: [req.params.id] },
  })

  res.json({
    id: req.params.id,
    object: "offer_condition",
    deleted: true,
  })
}
