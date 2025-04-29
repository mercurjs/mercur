import {
  createProductsWorkflow,
  createRemoteLinkStep
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
  RequestStatus
} from '../../../modules/requests/types'
import { SELLER_MODULE } from '../../../modules/seller'
import { createRequestStep } from '../steps'

export const createProductRequestWorkflow = createWorkflow(
  'create-product-request',
  function (input: {
    data: CreateRequestDTO
    seller_id: string
    additional_data?: any
  }) {
    const productPayload = transform(input, (input) => ({
      ...input.data.data,
      status: input.data.data.status === 'draft' ? 'draft' : 'proposed'
    }))

    const product = createProductsWorkflow.runAsStep({
      input: {
        products: [productPayload],
        additional_data: transform(input, (input) => ({
          ...input.additional_data,
          seller_id: input.seller_id
        }))
      }
    })

    const requestPayload = transform(
      { input, productPayload, product },
      ({ input, productPayload, product }) => ({
        ...input.data,
        data: {
          ...productPayload,
          product_id: product[0].id
        },
        status:
          productPayload.status === 'draft'
            ? ('draft' as RequestStatus)
            : ('pending' as RequestStatus)
      })
    )

    const request = createRequestStep(requestPayload)

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

    const productRequestCreatedHook = createHook('productRequestCreated', {
      requestId: request.id,
      sellerId: input.seller_id
    })
    return new WorkflowResponse(request, {
      hooks: [productRequestCreatedHook]
    })
  }
)
