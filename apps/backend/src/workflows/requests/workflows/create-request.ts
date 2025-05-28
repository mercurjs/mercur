import {
  createRemoteLinkStep,
  emitEventStep
} from '@medusajs/medusa/core-flows'
import {
  WorkflowResponse,
  createHook,
  createWorkflow,
  transform
} from '@medusajs/workflows-sdk'

import { REQUESTS_MODULE } from '../../../modules/requests'
import {
  CreateRequestDTO,
  SellerRequest
} from '../../../modules/requests/types'
import { SELLER_MODULE } from '../../../modules/seller'
import { createRequestStep } from '../steps'

export const createRequestWorkflow = createWorkflow(
  'create-request',
  function (input: { data: CreateRequestDTO; seller_id: string }) {
    const request = createRequestStep(input.data)

    const link = transform({ request, input }, ({ request, input }) => {
      return [
        {
          [SELLER_MODULE]: {
            seller_id: input.seller_id
          },
          [REQUESTS_MODULE]: {
            request_id: request[0].id
          }
        }
      ]
    })

    createRemoteLinkStep(link)

    emitEventStep({
      eventName: SellerRequest.CREATED,
      data: input.data
    })

    const requestCreatedHook = createHook('requestCreated', {
      requestId: request[0].id,
      sellerId: input.seller_id
    })
    return new WorkflowResponse(request, {
      hooks: [requestCreatedHook]
    })
  }
)
