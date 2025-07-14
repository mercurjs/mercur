import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { UpdateMemberDTO } from '@mercurjs/framework'

import { updateMemberStep } from '../steps'

/**
 * Updates member information and returns the modified member.
 */
export const updateMemberWorkflow = createWorkflow(
  'update-member',
  function (input: UpdateMemberDTO) {
    return new WorkflowResponse(updateMemberStep(input))
  }
)
