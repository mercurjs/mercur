import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminServiceFeeChangeLogListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: change_logs, metadata } = await query.graph({
    entity: "service_fee_change_log",
    fields: req.queryConfig.fields,
    filters: { service_fee_id: req.params.id },
    pagination: req.queryConfig.pagination,
  })

  res.json({
    change_logs,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
