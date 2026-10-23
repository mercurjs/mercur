import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HttpTypes } from "@mercurjs/types"

import { retrieveSettlement } from "../../../utils/settlements"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminSettlementResponse>
) => {
  const settlement = await retrieveSettlement(req.scope, req.params.id)
  res.json({ settlement })
}
