import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { AdminSettlementResponse } from "../../../../../types/http"
import { refetchSettlement } from "../helpers"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse<AdminSettlementResponse>) => {
  res.json({ settlement: await refetchSettlement(req.params.id, req.scope, req.queryConfig.fields) })
}
