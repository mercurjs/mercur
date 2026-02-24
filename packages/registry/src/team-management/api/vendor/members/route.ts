import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { VendorMemberListResponse } from "../../../modules/member"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<VendorMemberListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: members, metadata } = await query.graph({
    entity: "member",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    members,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
