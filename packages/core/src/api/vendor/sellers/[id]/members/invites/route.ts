import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorMemberInviteListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: memberInvites, metadata } = await query.graph({
    entity: "member_invite",
    fields: req.queryConfig.fields,
    filters: {
      seller_id: req.params.id,
      accepted: false,
    },
    pagination: req.queryConfig.pagination,
  })

  res.json({
    member_invites: memberInvites,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  })
}
