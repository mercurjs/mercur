import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { UpdateMemberDTO } from '../../../modules/seller/types'
import { updateMemberStep } from '../steps'

export const updateMemberWorkflow = createWorkflow(
  'update-member',
  function (input: UpdateMemberDTO) {
    return new WorkflowResponse(updateMemberStep(input))
  }
)
