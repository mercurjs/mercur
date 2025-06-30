import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import {
  CreateRequestDTO,
  RequestUpdated,
  SellerRequest
} from '@mercurjs/framework'

import { emitMultipleEventsStep } from '../../common/steps'
import { createRequestStep } from '../steps'

export const createSellerCreationRequestWorkflow = createWorkflow(
  'create-seller-creation-request',
  function (input: CreateRequestDTO) {
    const request = createRequestStep(input)

    emitMultipleEventsStep([
      {
        name: SellerRequest.CREATED,
        data: input
      },
      {
        name: RequestUpdated.CREATED,
        data: input
      }
    ])
    return new WorkflowResponse(request)
  }
)
