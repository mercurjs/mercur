import { WorkflowResponse, createWorkflow, transform } from "@medusajs/framework/workflows-sdk"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"

import { CreateMemberInviteDTO } from "../../../modules/member"
import { createMemberInviteStep } from "../steps/create-member-invite"

export const inviteMemberWorkflow = createWorkflow(
  "invite-member",
  function (input: CreateMemberInviteDTO) {
    const invite = createMemberInviteStep(input)

    const link = transform({ invite, input }, (data) => [{
      seller: {
        seller_id: data.input.seller_id,
      },
      member: {
        member_invite_id: data.invite.id,
      },
    }])

    createRemoteLinkStep(link)

    return new WorkflowResponse(invite)
  }
)
