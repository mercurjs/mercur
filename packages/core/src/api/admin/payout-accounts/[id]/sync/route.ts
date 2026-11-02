import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HttpTypes } from "@mercurjs/types"

import { syncPayoutAccountWorkflow } from "../../../../../workflows/payout"
import { refetchPayoutAccount } from "../../helpers"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminPayoutAccountResponse>
) => {
  await syncPayoutAccountWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  const payout_account = await refetchPayoutAccount(req.params.id, req.scope, req.queryConfig.fields)

  res.json({ payout_account })
}
