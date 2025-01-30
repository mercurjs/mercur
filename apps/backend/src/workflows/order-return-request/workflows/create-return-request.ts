import { Modules } from '@medusajs/framework/utils'
import {
  WorkflowResponse,
  createHook,
  createWorkflow,
  transform
} from '@medusajs/framework/workflows-sdk'
import { createRemoteLinkStep } from '@medusajs/medusa/core-flows'

import { ORDER_RETURN_MODULE } from '../../../modules/order-return-request'
import { CreateOrderReturnRequestDTO } from '../../../modules/order-return-request/types'
import { SELLER_MODULE } from '../../../modules/seller'
import {
  createOrderReturnRequestStep,
  validateOrderReturnRequestStep
} from '../steps'

export const createOrderReturnRequestWorkflow = createWorkflow(
  'create-order-return-request',
  function (input: { data: CreateOrderReturnRequestDTO; seller_id: string }) {
    validateOrderReturnRequestStep(input.data)
    const request = createOrderReturnRequestStep(input.data)
    const requestId = transform({ request }, ({ request }) => request.id)

    createRemoteLinkStep([
      {
        [SELLER_MODULE]: {
          seller_id: input.seller_id
        },
        [ORDER_RETURN_MODULE]: {
          order_return_request_id: requestId
        }
      },
      {
        [ORDER_RETURN_MODULE]: {
          order_return_request_id: requestId
        },
        [Modules.ORDER]: {
          order_id: input.data.order_id
        }
      }
    ])

    const orderReturnRequestCreatedHook = createHook(
      'orderReturnRequestCreated',
      {
        requestId: request.id
      }
    )

    return new WorkflowResponse(request, {
      hooks: [orderReturnRequestCreatedHook]
    })
  }
)
