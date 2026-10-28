import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { AdminSettlementListResponse } from "../../../../types/http"
import { listSettlementRows } from "../../../utils/settlements"
import { AdminGetSettlementsParamsType } from "../../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, AdminGetSettlementsParamsType>,
  res: MedusaResponse<AdminSettlementListResponse>
) => {
  res.json(await listSettlementRows(req.scope, req.filterableFields, req.queryConfig.pagination))
}
