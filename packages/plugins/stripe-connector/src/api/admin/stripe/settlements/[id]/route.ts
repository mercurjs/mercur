import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { retrieveSettlement } from "../../../../../pipeline/settlement-views"
import { AdminSettlementResponse } from "../../../../../types/http"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse<AdminSettlementResponse>) => {
  const settlement = await retrieveSettlement(req.scope, req.params.id)
  res.json({ settlement })
}
