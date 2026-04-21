import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"

import { VendorAcceptMemberInviteType } from "../../validators"
import { resolveMemberActorId } from "../../../../utils"
import { acceptMemberInviteWorkflow } from "../../../../../workflows/seller"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorAcceptMemberInviteType>,
  res: MedusaResponse
) => {
  const memberId = await resolveMemberActorId(req)

  const { result: member } = await acceptMemberInviteWorkflow(req.scope).run({
    input: {
      invite_token: req.validatedBody.invite_token,
      auth_identity_id: req.auth_context.auth_identity_id,
      member_id: memberId,
    },
  })

  res.json({ member })
}
