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

export const cancelValidateOrder = createStep(
  'cancel-validate-order',
  ({ order }: CancelValidateOrderStepInput) => {
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

    const throwErrorIf = (
      arr: unknown[],
      pred: (obj: any) => boolean,
      type: string
    ) => {
      if (arr?.some(pred)) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `All ${type} must be canceled before canceling an order`
        )
      }
    }

    const notCanceled = (o) => !o.canceled_at

    throwErrorIf(order_.fulfillments, notCanceled, 'fulfillments')
  }
)

export const cancelOrderWorkflow = createWorkflow(
  'cancel-single-order',
  (input: WorkflowData<OrderWorkflow.CancelOrderWorkflowInput>) => {
    const orderQuery = useQueryGraphStep({
      entity: 'orders',
      fields: ['id', 'status', 'items.id', 'fulfillments.canceled_at'],
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

    parallelize(
      deleteReservationsByLineItemsStep(lineItemIds),
      cancelOrdersStep({ orderIds: [order.id] }),
      emitEventStep({
        eventName: OrderWorkflowEvents.CANCELED,
        data: { id: order.id }
      })
    )

    return new WorkflowResponse(void 0)
  }
)
