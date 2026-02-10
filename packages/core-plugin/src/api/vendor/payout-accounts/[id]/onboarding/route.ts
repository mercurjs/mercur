import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { createOnboardingWorkflow } from "../../../../../workflows/payout"
import { validateSellerPayoutAccount } from "../../helpers"
import { VendorCreateOnboardingType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateOnboardingType>,
  res: MedusaResponse<HttpTypes.VendorOnboardingResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.auth_context.actor_id

  await validateSellerPayoutAccount(req.scope, sellerId, req.params.id)

  const { result } = await createOnboardingWorkflow(req.scope).run({
    input: {
      account_id: req.params.id,
      data: req.validatedBody.data,
      context: req.validatedBody.context,
    },
  })

  const {
    data: [onboarding],
  } = await query.graph({
    entity: "onboarding",
    fields: req.queryConfig.fields,
    filters: { id: result.id },
  })

  res.status(201).json({ onboarding })
}
