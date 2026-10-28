import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { AdminSettlementResponse } from "../../../../../../types/http"
import { retrySettlementPayoutWorkflow } from "../../../../../../workflows/settlements/workflows/retry-settlement-payout"
import { refetchSettlement } from "../../helpers"

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse<AdminSettlementResponse>) => {
  await retrySettlementPayoutWorkflow(req.scope).run({ input: { id: req.params.id } })
  res.json({ settlement: await refetchSettlement(req.params.id, req.scope, req.queryConfig.fields) })
}
