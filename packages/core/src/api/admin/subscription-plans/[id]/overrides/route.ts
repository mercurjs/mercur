import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { AdminCreateSubscriptionOverrideType } from "../../validators"
import { createSubscriptionOverridesWorkflow } from "../../../../../workflows/subscription"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateSubscriptionOverrideType>,
  res: MedusaResponse<HttpTypes.AdminSubscriptionPlanResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await createSubscriptionOverridesWorkflow(req.scope).run({
    input: [
      {
        ...req.validatedBody,
        plan_id: req.params.id,
      },
    ],
  })

  const {
    data: [subscription_plan],
  } = await query.graph({
    entity: "subscription_plan",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  res.status(201).json({ subscription_plan })
}
