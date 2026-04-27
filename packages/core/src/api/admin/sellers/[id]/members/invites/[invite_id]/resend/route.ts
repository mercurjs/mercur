import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { resendMemberInviteWorkflow } from "../../../../../../../../workflows/seller"

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

  res.status(200).json({
    member_invite: invite,
  })
}
