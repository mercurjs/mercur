import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MercurModules } from "@mercurjs/types"

import { resendMemberInviteWorkflow } from "../../../../../../../../workflows/seller"
import SellerModuleService from "../../../../../../../../modules/seller/service"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { result } = await resendMemberInviteWorkflow(req.scope).run({
    input: {
      invite_id: req.params.invite_id,
      seller_id: req.params.id,
    },
  })

  const invite = (result as any[])[0]
  const sellerService = req.scope.resolve<SellerModuleService>(
    MercurModules.SELLER
  )

  res.status(200).json({
    member_invite: {
      ...invite,
      invite_url: invite?.token
        ? sellerService.buildInviteUrl(invite.token)
        : null,
    },
  })
}
