import { WorkflowResponse, createWorkflow } from "@medusajs/framework/workflows-sdk"

import { UpdateMemberDTO } from "../../../modules/member"
import { updateMemberStep } from "../steps/update-member"

export const updateMemberWorkflow = createWorkflow(
  "update-member",
  function (input: UpdateMemberDTO) {
    return new WorkflowResponse(updateMemberStep(input))
  }
)
