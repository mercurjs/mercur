import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { AdminUpdateSubscriptionPlanType } from "../validators"
import {
  updateSubscriptionPlansWorkflow,
  deleteSubscriptionPlansWorkflow,
} from "../../../../workflows/subscription"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminSubscriptionPlanResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [subscription_plan],
  } = await query.graph({
    entity: "subscription_plan",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  if (!subscription_plan) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Subscription plan with id ${req.params.id} was not found`
    )
  }

  res.json({ subscription_plan })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateSubscriptionPlanType>,
  res: MedusaResponse<HttpTypes.AdminSubscriptionPlanResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { result } = await updateSubscriptionPlansWorkflow(req.scope).run({
    input: [{ id: req.params.id, ...req.validatedBody }],
  })

  const {
    data: [subscription_plan],
  } = await query.graph({
    entity: "subscription_plan",
    fields: req.queryConfig.fields,
    filters: { id: result[0].id },
  })

  res.json({ subscription_plan })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminSubscriptionPlanDeleteResponse>
) => {
  await deleteSubscriptionPlansWorkflow(req.scope).run({
    input: { ids: [req.params.id] },
  })

  res.json({
    id: req.params.id,
    object: "subscription_plan",
    deleted: true,
  })
}
