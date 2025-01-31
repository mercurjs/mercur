import { createRemoteLinkStep } from '@medusajs/medusa/core-flows'
import {
  WorkflowResponse,
  createHook,
  createWorkflow,
  transform
} from '@medusajs/workflows-sdk'

import { REQUESTS_MODULE } from '../../../modules/requests'
import { CreateRequestDTO } from '../../../modules/requests/types'
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
            request_id: request.id
          }
        }
      ]
    })

    createRemoteLinkStep(link)

    const requestCreatedHook = createHook('requestCreated', {
      requestId: request.id,
      sellerId: input.seller_id
    })
    return new WorkflowResponse(request, {
      hooks: [requestCreatedHook]
    })
  }
)
