import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import sellerMemberInvite from "../../../../links/seller-member-invite"
import { MEMBER_MODULE, MemberModuleService, VendorMemberInviteResponse } from "../../../../modules/member"
import { acceptMemberInviteWorkflow } from "../../../../workflows/member/workflows/accept-member-invite"
import { VendorAcceptMemberInviteType } from "../validators"

export const AUTHENTICATE = false

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorAcceptMemberInviteType>,
  res: MedusaResponse<VendorMemberInviteResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const memberService = req.scope.resolve<MemberModuleService>(MEMBER_MODULE)

  // Validate the token to get the invite ID
  const validatedInvite = await memberService.validateInviteToken(req.validatedBody.token)

  // Get seller_id from the link table
  const { data: [link] } = await query.graph({
    entity: sellerMemberInvite.entryPoint,
    filters: { member_invite_id: validatedInvite.id },
    fields: ["seller_id"],
  })

  if (!link?.seller_id) {
    throw new Error("Could not find seller for this invite")
  }

  const { result } = await acceptMemberInviteWorkflow(req.scope).run({
    input: {
      invite: req.validatedBody,
      authIdentityId: req.auth_context.auth_identity_id,
      sellerId: link.seller_id,
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
