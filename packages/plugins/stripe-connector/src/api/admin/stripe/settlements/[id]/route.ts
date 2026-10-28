import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { AdminSettlementResponse } from "../../../../../types/http"
import { retrieveSettlementDetail } from "../../../../utils/settlements"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse<AdminSettlementResponse>) => {
  res.json({ settlement: await retrieveSettlementDetail(req.scope, req.params.id) })
}
