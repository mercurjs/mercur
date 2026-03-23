import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { AdminUpdateSubscriptionOverrideType } from "../../../validators"
import {
  updateSubscriptionOverridesWorkflow,
  deleteSubscriptionOverridesWorkflow,
} from "../../../../../../workflows/subscription"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminSubscriptionOverrideResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [subscription_override],
  } = await query.graph({
    entity: "subscription_override",
    fields: req.queryConfig.fields,
    filters: { id: req.params.override_id },
  })

  if (!subscription_override) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Subscription override with id ${req.params.override_id} was not found`
    )
  }

  res.json({ subscription_override })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateSubscriptionOverrideType>,
  res: MedusaResponse<HttpTypes.AdminSubscriptionOverrideResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { result } = await updateSubscriptionOverridesWorkflow(req.scope).run({
    input: [{ id: req.params.override_id, ...req.validatedBody }],
  })

  const {
    data: [subscription_override],
  } = await query.graph({
    entity: "subscription_override",
    fields: req.queryConfig.fields,
    filters: { id: result[0].id },
  })

  res.json({ subscription_override })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminSubscriptionOverrideDeleteResponse>
) => {
  await deleteSubscriptionOverridesWorkflow(req.scope).run({
    input: { ids: [req.params.override_id] },
  })

  res.json({
    id: req.params.override_id,
    object: "subscription_override",
    deleted: true,
  })
}
