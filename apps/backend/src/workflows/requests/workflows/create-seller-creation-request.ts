import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { CreateRequestDTO } from '../../../modules/requests/types'
import { createRequestStep } from '../steps'

export const createSellerCreationRequestWorkflow = createWorkflow(
  'create-seller-creation-request',
  function (input: CreateRequestDTO) {
    const request = createRequestStep(input)

    return new WorkflowResponse(request)
  }
)
