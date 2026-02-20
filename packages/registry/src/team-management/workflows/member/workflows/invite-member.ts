import { WorkflowResponse, createWorkflow } from "@medusajs/framework/workflows-sdk"

import { CreateMemberInviteDTO } from "../../../modules/member"
import { createMemberInviteStep } from "../steps/create-member-invite"

export const inviteMemberWorkflow = createWorkflow(
  "invite-member",
  function (input: CreateMemberInviteDTO) {
    return new WorkflowResponse(createMemberInviteStep(input))
  }
)
