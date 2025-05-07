import { emitEventStep } from '@medusajs/medusa/core-flows'
import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import {
  CreateRequestDTO,
  SellerRequest
} from '../../../modules/requests/types'
import { createRequestStep } from '../steps'

export const createSellerCreationRequestWorkflow = createWorkflow(
  'create-seller-creation-request',
  function (input: CreateRequestDTO) {
    const request = createRequestStep(input)

    emitEventStep({
      eventName: SellerRequest.CREATED,
      data: input
    })

    return new WorkflowResponse(request)
  }
)
