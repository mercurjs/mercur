import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { CreateSellerInvitationDTO } from '@mercurjs/framework'

import { sendSellerInvitationEmailStep } from '../steps/send-invitation-email'

/**
 * Sends invitation email to potential seller with registration link.
 */
export const inviteSellerWorkflow = createWorkflow(
  'invite-seller',
  function (input: CreateSellerInvitationDTO) {
    return new WorkflowResponse(sendSellerInvitationEmailStep(input))
  }
)
