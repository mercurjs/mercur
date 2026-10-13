import { createAndCompleteReturnOrderWorkflow } from "@medusajs/core-flows"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { FeatureFlag, MedusaError } from "@medusajs/framework/utils"
import { MercurFeatureFlags } from "@mercurjs/types"

// Medusa's stock endpoint creates and confirms a return straight away without
// authentication. With return requests enabled, customers go through the
// reviewed /store/return-requests flow instead.
export const POST = async (
  req: MedusaRequest<HttpTypes.StoreCreateReturn>,
  res: MedusaResponse<HttpTypes.StoreReturnResponse>
) => {
  if (FeatureFlag.isFeatureEnabled(MercurFeatureFlags.RETURN_REQUEST)) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Returns must be requested through /store/return-requests."
    )
  }

  const { result } = await createAndCompleteReturnOrderWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.status(200).json({ return: result as HttpTypes.StoreReturn })
}
