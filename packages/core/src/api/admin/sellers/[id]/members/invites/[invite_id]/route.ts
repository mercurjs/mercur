import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { deleteMemberInviteWorkflow } from "../../../../../../../workflows/seller"

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  await deleteMemberInviteWorkflow(req.scope).run({
    input: {
      invite_id: req.params.invite_id,
    },
  })

  res.status(200).json({ id: req.params.invite_id, object: "member_invite", deleted: true })
}
