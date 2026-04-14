import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: memberInvites, metadata } = await query.graph({
    entity: "member_invite",
    fields: req.queryConfig.fields,
    filters: {
      seller_id: req.params.id,
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
