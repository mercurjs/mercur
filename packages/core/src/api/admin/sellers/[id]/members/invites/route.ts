import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import SellerModuleService from "../../../../../../modules/seller/service"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerService = req.scope.resolve<SellerModuleService>(
    MercurModules.SELLER
  )

  const { data: memberInvites, metadata } = await query.graph({
    entity: "member_invite",
    fields: req.queryConfig.fields,
    filters: {
      seller_id: req.params.id,
    },
    pagination: req.queryConfig.pagination,
  })

  const enriched = memberInvites.map((invite: any) => ({
    ...invite,
    invite_url: invite.token
      ? sellerService.buildInviteUrl(invite.token)
      : null,
  }))

  res.json({
    member_invites: enriched,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  })
}
