import {
  WorkflowResponse,
  createHook,
  createWorkflow
} from '@medusajs/workflows-sdk'

import { UpdateRequestDTO } from '../../../modules/requests/types'
import { updateRequestStep } from '../steps'

export const updateRequestWorkflow = createWorkflow(
  'update-request',
  function (input: UpdateRequestDTO) {
    const request = updateRequestStep(input)

    const requestUpdatedHook = createHook('requestUpdated', {
      id: input.id
    })
    return new WorkflowResponse(request, { hooks: [requestUpdatedHook] })
  }
)
