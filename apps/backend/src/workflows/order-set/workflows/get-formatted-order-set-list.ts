import { deduplicate } from '@medusajs/framework/utils'
import {
  WorkflowResponse,
  createWorkflow,
  transform
} from '@medusajs/framework/workflows-sdk'
import { useRemoteQueryStep } from '@medusajs/medusa/core-flows'

import { formatOrderSets } from '../utils'

export const getFormattedOrderSetListWorkflow = createWorkflow(
  'get-formatted-order-set-list',
  function (input: { fields?: string[]; variables?: Record<string, any> }) {
    const fields = transform(input, ({ fields }) => {
      return deduplicate([
        ...(fields ?? []),
        'id',
        'updated_at',
        'created_at',
        'display_id',
        'customer_id',
        'customer.*',
        'cart_id',
        'cart.*',
        'orders.*',
        'orders.items.*'
      ])
    })

    const orderSets = useRemoteQueryStep({
      entry_point: 'order_set',
      fields,
      variables: input.variables
    })

    const formattedOrderSets = transform(orderSets, formatOrderSets)

    return new WorkflowResponse(formattedOrderSets)
  }
)
