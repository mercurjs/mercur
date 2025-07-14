import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { CreateMemberInviteDTO } from '@mercurjs/framework'

import { createMemberInviteStep } from '../steps'

/**
 * Creates member invitation and returns the invite details.
 */
export const inviteMemberWorkflow = createWorkflow(
  'invite-member',
  function (input: CreateMemberInviteDTO) {
    return new WorkflowResponse(createMemberInviteStep(input))
  }
)
