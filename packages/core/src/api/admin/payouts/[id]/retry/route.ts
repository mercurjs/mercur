import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HttpTypes } from "@mercurjs/types"

import { retryPayoutWorkflow } from "../../../../../workflows/payout"
import { refetchPayout } from "../../helpers"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminPayoutResponse>
) => {
  await retryPayoutWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  const payout = await refetchPayout(req.params.id, req.scope, req.queryConfig.fields)

  res.json({ payout })
}
