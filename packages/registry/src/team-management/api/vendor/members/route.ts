import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import sellerMember from "../../../links/seller-member"
import { VendorMemberListResponse } from "../../../modules/member"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<VendorMemberListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: links, metadata } = await query.graph({
    entity: sellerMember.entryPoint,
    fields: req.queryConfig.fields.map((field) => `member.${field}`),
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    members: links.map((relation: any) => relation.member),
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
