import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { updateMembersStep } from "../steps"

export const updateMemberWorkflowId = "update-member"

type UpdateMemberWorkflowInput = {
  selector: Record<string, unknown>
  update: {
    first_name?: string | null
    last_name?: string | null
    locale?: string | null
  }
}

export const updateMemberWorkflow = createWorkflow(
  updateMemberWorkflowId,
  function (input: UpdateMemberWorkflowInput) {
    const members = updateMembersStep(input)

    return new WorkflowResponse(members)
  }
)
