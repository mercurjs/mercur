import { emitEventStep } from '@medusajs/medusa/core-flows'
import {
  WorkflowResponse,
  createHook,
  createWorkflow,
  transform
} from '@medusajs/workflows-sdk'

import { UpdateRequestDTO } from '@mercurjs/framework'

import { updateRequestStep } from '../steps'

export const updateRequestWorkflow = createWorkflow(
  'update-request',
  function (input: UpdateRequestDTO) {
    const request = updateRequestStep(input)

    const requestUpdatedHook = createHook('requestUpdated', {
      id: input.id
    })

    emitEventStep({
      eventName: transform(request, (request) => {
        return `requests.${request.type}.${request.status}`
      }),
      data: request
    })
    return new WorkflowResponse(request, { hooks: [requestUpdatedHook] })
  }
)
