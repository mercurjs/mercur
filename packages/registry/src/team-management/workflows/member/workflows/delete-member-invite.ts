import { createWorkflow } from "@medusajs/framework/workflows-sdk"

import { deleteMemberInvitesStep } from "../steps/delete-member-invite"

export const deleteMemberInviteWorkflow = createWorkflow(
  "delete-member-invite",
  function (id: string) {
    deleteMemberInvitesStep(id)
  }
)
