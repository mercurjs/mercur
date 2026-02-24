import { WorkflowResponse, createWorkflow, transform } from "@medusajs/framework/workflows-sdk"

import { CreateMemberInviteDTO } from "../../../modules/member"
import { createMemberInviteStep } from "../steps/create-member-invite"

export const inviteMemberWorkflow = createWorkflow(
  "invite-member",
  function (input: CreateMemberInviteDTO) {
    const invite = createMemberInviteStep(input)

    return new WorkflowResponse(invite)
  }
)
