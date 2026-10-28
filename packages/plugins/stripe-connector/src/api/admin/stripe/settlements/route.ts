import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { AdminSettlement, AdminSettlementListResponse } from "../../../../types/http"
import { AdminGetSettlementsParamsType } from "../../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, AdminGetSettlementsParamsType>,
  res: MedusaResponse<AdminSettlementListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: settlements, metadata } = await query.graph({
    entity: "settlement",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    settlements: settlements as unknown as AdminSettlement[],
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
