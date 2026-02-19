import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { VendorMemberInviteResponse } from "../../../../modules/member"
import { acceptMemberInviteWorkflow } from "../../../../workflows/member/workflows/accept-member-invite"
import { VendorAcceptMemberInviteType } from "../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorAcceptMemberInviteType>,
  res: MedusaResponse<VendorMemberInviteResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { result } = await acceptMemberInviteWorkflow(req.scope).run({
    input: {
      invite: req.validatedBody,
      authIdentityId: req.auth_context.auth_identity_id,
    },
  })

  const {
    data: [invite],
  } = await query.graph(
    {
      entity: "member_invite",
      fields: req.queryConfig.fields,
      filters: { id: result.id },
    },
    { throwIfKeyNotFound: true }
  )

  res.json({ invite })
}
