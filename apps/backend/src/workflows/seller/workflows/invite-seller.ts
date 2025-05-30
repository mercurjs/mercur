import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { CreateSellerInvitationDTO } from '../../../modules/seller/types'
import { sendSellerInvitationEmailStep } from '../steps/send-invitation-email'

export const inviteSellerWorkflow = createWorkflow(
  'invite-seller',
  function (input: CreateSellerInvitationDTO) {
    return new WorkflowResponse(sendSellerInvitationEmailStep(input))
  }
)
