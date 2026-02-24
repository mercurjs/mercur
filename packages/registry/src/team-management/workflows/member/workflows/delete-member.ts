import { createWorkflow } from "@medusajs/framework/workflows-sdk"

import { deleteMemberStep } from "../steps/delete-member"

export const deleteMemberWorkflow = createWorkflow(
  "delete-member",
  function (id: string) {
    deleteMemberStep(id)
  }
)
