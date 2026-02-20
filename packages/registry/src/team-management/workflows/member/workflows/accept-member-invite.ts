import { parallelize } from "@medusajs/framework/workflows-sdk"
import { setAuthAppMetadataStep } from "@medusajs/medusa/core-flows"
import { WorkflowResponse, createWorkflow } from "@medusajs/framework/workflows-sdk"

import { AcceptMemberInviteDTO } from "../../../modules/member"
import { createMemberStep } from "../steps/create-member"
import { updateMemberInviteStep } from "../steps/update-member-invite"
import { validateMemberInviteStep } from "../steps/validate-member-invite"

type AcceptMemberInviteWorkflowInput = {
  invite: AcceptMemberInviteDTO
  authIdentityId: string
}

export const acceptMemberInviteWorkflow = createWorkflow(
  "accept-member-invite",
  function (input: AcceptMemberInviteWorkflowInput) {
    const invite = validateMemberInviteStep(input.invite)

    const [member] = parallelize(
      createMemberStep({
        seller_id: invite.seller.id,
        name: input.invite.name,
        role: invite.role,
        email: invite.email,
      }),
      updateMemberInviteStep({
        id: invite.id,
        accepted: true,
      })
    )

    setAuthAppMetadataStep({
      authIdentityId: input.authIdentityId,
      actorType: "seller",
      value: invite.seller.id,
    })

    return new WorkflowResponse(invite)
  }
)
