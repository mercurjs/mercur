import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { AdminCreateSubscriptionPlanType, AdminGetSubscriptionPlansParamsType } from "./validators"
import { createSubscriptionPlansWorkflow } from "../../../workflows/subscription"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetSubscriptionPlansParamsType>,
  res: MedusaResponse<HttpTypes.AdminSubscriptionPlanListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: subscription_plans, metadata } = await query.graph({
    entity: "subscription_plan",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    subscription_plans,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateSubscriptionPlanType>,
  res: MedusaResponse<HttpTypes.AdminSubscriptionPlanResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { result } = await createSubscriptionPlansWorkflow(req.scope).run({
    input: [req.validatedBody],
  })

  const {
    data: [subscription_plan],
  } = await query.graph({
    entity: "subscription_plan",
    fields: req.queryConfig.fields,
    filters: { id: result[0].id },
  })

  res.status(201).json({ subscription_plan })
}
