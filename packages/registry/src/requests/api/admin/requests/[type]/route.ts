import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { AdminRequestListResponse } from "../../../../types"
import { AdminGetRequestsParamsType } from "../validators"

export async function GET(
  req: AuthenticatedMedusaRequest<AdminGetRequestsParamsType>,
  res: MedusaResponse<AdminRequestListResponse>
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const alias = req.params.type!

  const { data: entities, metadata } = await query.graph({
    entity: alias,
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    requests: entities,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
