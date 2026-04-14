import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"

import { sendSellerInvitationEmailStep } from "../steps/send-invitation-email"

type InviteSellerInput = {
  email: string
  registration_url?: string
}

export const inviteSellerWorkflow = createWorkflow(
  "invite-seller",
  (input: InviteSellerInput) => {
    const result = sendSellerInvitationEmailStep(input)

    return new WorkflowResponse(result)
  }
)
