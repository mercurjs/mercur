import { OrderDTO, OrderDetailDTO } from '@medusajs/framework/types'
import { deduplicate } from '@medusajs/framework/utils'
import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform
} from '@medusajs/framework/workflows-sdk'
import {
  GetOrdersListWorkflowInput,
  useRemoteQueryStep
} from '@medusajs/medusa/core-flows'

import { getLastFulfillmentStatus } from '../utils/aggregate-status'

export const getVendorOrdersListWorkflow = createWorkflow(
  'get-vendor-orders-list',
  (input: WorkflowData<GetOrdersListWorkflowInput>) => {
    const fields = transform(input, ({ fields }) => {
      return deduplicate([
        ...fields,
        'id',
        'status',
        'version',
        'items.*',
        'fulfillments.packed_at',
        'fulfillments.shipped_at',
        'fulfillments.delivered_at',
        'fulfillments.canceled_at',
        'split_order_payment.*'
      ])
    })

    const orders: OrderDTO[] = useRemoteQueryStep({
      entry_point: 'orders',
      fields,
      variables: input.variables,
      list: true
    })

    const aggregatedOrders = transform({ orders }, ({ orders }) => {
      const orders_ = orders as any
      const data = orders_.rows ? orders_.rows : orders_

      for (const order of data) {
        delete order.summary

        order.payment_status = order.split_order_payment?.status
        order.fulfillment_status = getLastFulfillmentStatus(
          order
        ) as OrderDetailDTO['fulfillment_status']
      }

      return orders
    })

    return new WorkflowResponse(aggregatedOrders)
  }
)
