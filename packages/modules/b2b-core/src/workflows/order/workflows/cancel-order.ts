import {
  FulfillmentDTO,
  OrderDTO,
  OrderWorkflow,
  PaymentCollectionDTO
} from '@medusajs/framework/types'
import {
  MedusaError,
  OrderStatus,
  OrderWorkflowEvents
} from '@medusajs/framework/utils'
import {
  WorkflowData,
  WorkflowResponse,
  createStep,
  createWorkflow,
  parallelize,
  transform
} from '@medusajs/framework/workflows-sdk'
import {
  CancelValidateOrderStepInput,
  cancelOrdersStep,
  deleteReservationsByLineItemsStep,
  emitEventStep,
  useQueryGraphStep
} from '@medusajs/medusa/core-flows'

import { createPayoutReversalStep } from '../../payout/steps'
import { refundSplitOrderPaymentWorkflow } from '../../split-order-payment/workflows'

export const cancelValidateOrder = createStep(
  'cancel-validate-order',
  async ({ order }: CancelValidateOrderStepInput) => {
    const order_ = order as OrderDTO & {
      payment_collections: PaymentCollectionDTO[]
      fulfillments: FulfillmentDTO[]
    }

    if (order_.status === OrderStatus.CANCELED) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Order with id ${order.id} has been canceled.`
      )
    }

    if (order_.fulfillments.some((o) => !o.canceled_at)) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `All fulfillments must be canceled before canceling an order`
      )
    }
  }
)

export const cancelOrderWorkflow = createWorkflow(
  'cancel-single-order',
  (input: WorkflowData<OrderWorkflow.CancelOrderWorkflowInput>) => {
    const orderQuery = useQueryGraphStep({
      entity: 'orders',
      fields: [
        'id',
        'status',
        'currency_code',
        'items.id',
        'fulfillments.canceled_at',
        'split_order_payment.*',
        'payouts.*'
      ],
      filters: { id: input.order_id },
      options: { throwIfKeyNotFound: true }
    }).config({ name: 'get-cart' })

    const order = transform(
      { orderQuery },
      ({ orderQuery }) => orderQuery.data[0]
    )

    cancelValidateOrder({ order, input })

    const lineItemIds = transform({ order }, ({ order }) => {
      return order.items?.map((i) => i.id)
    })

    const payoutId = transform({ order }, ({ order }) => {
      return order.payouts && order.payouts[0] ? order.payouts[0].id : null
    })

    parallelize(
      deleteReservationsByLineItemsStep(lineItemIds),
      cancelOrdersStep({ orderIds: [order.id] }),
      refundSplitOrderPaymentWorkflow.runAsStep({
        input: {
          id: order.split_order_payment.id,
          amount: order.split_order_payment.captured_amount
        }
      }),
      createPayoutReversalStep({
        payout_id: payoutId,
        amount: order.split_order_payment.captured_amount,
        currency_code: order.currency_code
      }),
      emitEventStep({
        eventName: OrderWorkflowEvents.CANCELED,
        data: { id: order.id }
      })
    )

    return new WorkflowResponse(order.id)
  }
)
