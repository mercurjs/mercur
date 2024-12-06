import { deduplicate } from '@medusajs/framework/utils'
import {
  WorkflowResponse,
  createWorkflow,
  transform
} from '@medusajs/framework/workflows-sdk'

import { getOrderSetListStep } from '../steps'
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
        'orders.*',
        'orders.items.*'
      ])
    })

    const { orderSets, count } = getOrderSetListStep({
      fields: fields,
      variables: input.variables
    })

    const formattedOrderSets = transform(orderSets, formatOrderSets)

    return new WorkflowResponse({ orderSets: formattedOrderSets, count })
  }
)
