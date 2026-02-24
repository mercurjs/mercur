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

  const { q, ...filterableFields } = req.filterableFields as Record<
    string,
    unknown
  >

  const { data: links, metadata } = await query.graph({
    entity: sellerMember.entryPoint,
    fields: req.queryConfig.fields.map((field) => `member.${field}`),
    filters: filterableFields,
    pagination: !q ? req.queryConfig.pagination : undefined,
  })

  let members = links.map((relation: any) => relation.member)

  if (q) {
    const search = (q as string).toLowerCase()
    members = members.filter(
      (m: any) =>
        m.name?.toLowerCase().includes(search) ||
        m.email?.toLowerCase().includes(search)
    )
  }

  const total = q ? members.length : (metadata?.count ?? 0)
  const offset = req.queryConfig.pagination?.skip ?? 0
  const limit = req.queryConfig.pagination?.take ?? 20

  if (q) {
    members = members.slice(offset, offset + limit)
  }

  res.json({
    members,
    count: total,
    offset,
    limit,
  })
}
