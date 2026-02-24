import { parallelize, transform } from "@medusajs/framework/workflows-sdk"
import {
  setAuthAppMetadataStep,
  createRemoteLinkStep,
} from "@medusajs/medusa/core-flows"
import { WorkflowResponse, createWorkflow } from "@medusajs/framework/workflows-sdk"

import { AcceptMemberInviteDTO } from "../../../modules/member"
import { createMemberStep } from "../steps/create-member"
import { updateMemberInviteStep } from "../steps/update-member-invite"
import { validateMemberInviteStep } from "../steps/validate-member-invite"

type AcceptMemberInviteWorkflowInput = {
  invite: AcceptMemberInviteDTO
  authIdentityId: string
  sellerId: string
}

export const acceptMemberInviteWorkflow = createWorkflow(
  "accept-member-invite",
  function (input: AcceptMemberInviteWorkflowInput) {
    const invite = validateMemberInviteStep(input.invite)

    const [member] = parallelize(
      createMemberStep({
        seller_id: input.sellerId,
        name: input.invite.name,
        role: invite.role,
        email: invite.email,
      }),
      updateMemberInviteStep({
        id: invite.id,
        accepted: true,
      })
    )

    const link = transform({ member, input }, (data) => [{
      seller: {
        seller_id: data.input.sellerId,
      },
      member: {
        member_id: data.member.id,
      },
    }])

    createRemoteLinkStep(link)

    setAuthAppMetadataStep({
      authIdentityId: input.authIdentityId,
      actorType: "seller",
      value: input.sellerId,
    })

    return new WorkflowResponse(invite)
  }
)
