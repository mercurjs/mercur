import {
  WorkflowResponse,
  createWorkflow,
  transform
} from '@medusajs/framework/workflows-sdk'
import {
  beginReturnOrderWorkflow,
  confirmReturnRequestWorkflow,
  requestItemReturnWorkflow
} from '@medusajs/medusa/core-flows'

import {
  AdminUpdateOrderReturnRequestDTO,
  VendorUpdateOrderReturnRequestDTO
} from '@mercurjs/framework'

import { retrieveOrderFromReturnRequestStep } from '../steps'

export const proceedReturnRequestWorkflow = createWorkflow(
  'proceed-return-request',
  function (
    input: VendorUpdateOrderReturnRequestDTO | AdminUpdateOrderReturnRequestDTO
  ) {
    const order = retrieveOrderFromReturnRequestStep(input)
    const beginPayload = transform({ order, input }, ({ order, input }) => {
      return {
        input: {
          order_id: order.order_id,
          location_id: input.location_id
        }
      }
    })

    const returnOrder = beginReturnOrderWorkflow.runAsStep(beginPayload)

    const requestItemReturnPayload = transform(
      { returnOrder, order },
      ({ returnOrder, order }) => {
        return {
          input: {
            return_id: returnOrder.return_id,
            items: order.order_return_request.line_items.map((item) => {
              return {
                id: item.line_item_id,
                quantity: item.quantity,
                reason_id: item.reason_id
              }
            })
          }
        }
      }
    )

    requestItemReturnWorkflow.runAsStep(requestItemReturnPayload)

    const confirmReturnRequestPayload = transform(
      returnOrder,
      (returnOrder) => {
        return {
          input: {
            return_id: returnOrder.return_id
          }
        }
      }
    )

    confirmReturnRequestWorkflow.runAsStep(confirmReturnRequestPayload)

    return new WorkflowResponse(returnOrder)
  }
)
