import { WorkflowResponse, createWorkflow } from "@medusajs/workflows-sdk";

import { CreateSellerInvitationDTO } from "@mercurjs/framework";

import { sendSellerInvitationEmailStep } from "../steps";

export const inviteSellerWorkflow = createWorkflow(
  "invite-seller",
  function (input: CreateSellerInvitationDTO) {
    return new WorkflowResponse(sendSellerInvitationEmailStep(input));
  }
);
