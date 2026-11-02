import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@mercurjs/types"

import { createOnboardingWorkflow } from "../../../../../workflows/payout"
import { refetchOnboarding, validateSellerPayoutAccount } from "../../helpers"
import { VendorCreateOnboardingType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateOnboardingType>,
  res: MedusaResponse<HttpTypes.VendorOnboardingResponse>
) => {
  const sellerId = req.seller_context!.seller_id

  await validateSellerPayoutAccount(req.scope, sellerId, req.params.id)

  const { result } = await createOnboardingWorkflow(req.scope).run({
    input: {
      account_id: req.params.id,
      data: req.validatedBody.data,
      context: req.validatedBody.context,
    },
  })

  const onboarding = await refetchOnboarding(result.id, req.scope, req.queryConfig.fields)

  res.status(201).json({ onboarding })
}
