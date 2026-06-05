import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"

import { VendorAcceptMemberInviteType } from "../../validators"
import { acceptMemberInviteWorkflow } from "../../../../../workflows/seller"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorAcceptMemberInviteType>,
  res: MedusaResponse
) => {
  const { result: member } = await acceptMemberInviteWorkflow(req.scope).run({
    input: {
      invite_token: req.validatedBody.invite_token,
      auth_identity_id: req.auth_context.auth_identity_id,
      member_id: req.auth_context.actor_id,
      first_name: req.validatedBody.first_name ?? undefined,
      last_name: req.validatedBody.last_name ?? undefined,
    },
  })

  res.json({ member })
}
