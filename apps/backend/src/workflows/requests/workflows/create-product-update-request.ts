import { ProductStatus } from '@medusajs/framework/utils'
import { createRemoteLinkStep } from '@medusajs/medusa/core-flows'
import {
  WorkflowResponse,
  createWorkflow,
  transform
} from '@medusajs/workflows-sdk'

import {
  CreateRequestDTO,
  ProductUpdateRequestUpdatedEvent,
  RequestStatus,
  RequestUpdated
} from '@mercurjs/framework'
import { REQUESTS_MODULE } from '@mercurjs/requests'
import { SELLER_MODULE } from '@mercurjs/seller'

import { emitMultipleEventsStep } from '../../common/steps'
import { updateProductStatusStep } from '../../product/steps'
import { createRequestStep } from '../steps'

export const createProductUpdateRequestWorkflow = createWorkflow(
  'create-product-update-request',
  function (input: {
    data: CreateRequestDTO
    seller_id: string
    additional_data?: any
  }) {
    updateProductStatusStep(
      transform({ input }, ({ input }) => ({
        id: input.data.data.product_id,
        status: ProductStatus.PROPOSED
      }))
    )

    const requestPayload = transform({ input }, ({ input }) => ({
      ...input.data,
      data: {
        ...input.data.data,
        product_id: input.data.data.product_id
      },
      type: 'product_update',
      status: 'pending' as RequestStatus
    }))

    const request = createRequestStep(requestPayload)

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
    emitMultipleEventsStep([
      {
        name: RequestUpdated.CREATED,
        data: {
          ...input.data,
          sellerId: input.seller_id
        }
      },
      {
        name: ProductUpdateRequestUpdatedEvent.CREATED,
        data: { id: request[0].id }
      }
    ])
    return new WorkflowResponse(request)
  }
)
