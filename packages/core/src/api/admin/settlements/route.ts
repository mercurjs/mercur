import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HttpTypes } from "@mercurjs/types"

import { listSettlements } from "../../utils/settlements"
import { AdminGetSettlementsParamsType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, AdminGetSettlementsParamsType>,
  res: MedusaResponse<HttpTypes.AdminSettlementListResponse>
) => {
  const { offset = 0, limit = 20, order: _order, fields: _fields, ...filters } = req.validatedQuery
  const { settlements, count } = await listSettlements(req.scope, {
    filters: filters as Record<string, unknown>,
    skip: offset,
    take: limit,
  })

  res.json({ settlements, count, offset, limit })
}
