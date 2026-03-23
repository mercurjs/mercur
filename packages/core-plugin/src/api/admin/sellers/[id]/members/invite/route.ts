import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { AdminInviteSellerMemberType } from "../../../validators"
import { createMemberInvitesWorkflow } from "../../../../../../workflows/seller"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminInviteSellerMemberType>,
  res: MedusaResponse
) => {
  const { result: invites } = await createMemberInvitesWorkflow(
    req.scope
  ).run({
    input: [
      {
        seller_id: req.params.id,
        email: req.validatedBody.email,
        role_handle: req.validatedBody.role_handle,
      },
    ],
  })

  res.status(201).json({ member_invite: invites[0] })
}
