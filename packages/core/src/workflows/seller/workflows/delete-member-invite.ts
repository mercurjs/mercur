import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"

import { deleteMemberInviteStep } from "../steps"

export const deleteMemberInviteWorkflowId = "delete-member-invite"

type DeleteMemberInviteWorkflowInput = {
  invite_id: string
}

export const deleteMemberInviteWorkflow = createWorkflow(
  deleteMemberInviteWorkflowId,
  function (input: DeleteMemberInviteWorkflowInput) {
    deleteMemberInviteStep([input.invite_id])

    return new WorkflowResponse(void 0)
  }
)
