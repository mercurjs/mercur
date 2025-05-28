import {
  WorkflowResponse,
  createWorkflow,
  transform
} from '@medusajs/framework/workflows-sdk'
import { useQueryGraphStep } from '@medusajs/medusa/core-flows'

import { updateSplitOrderPaymentsStep } from '../steps'

export const markSplitOrderPaymentsAsCapturedWorkflow = createWorkflow(
  {
    name: 'mark-split-order-payments-as-captured'
  },
  function (payment_collection_id: string) {
    const payments = useQueryGraphStep({
      entity: 'split_order_payment',
      fields: ['*'],
      filters: {
        payment_collection_id
      }
    })

    const updatePayload = transform(payments, (payments) => {
      const entities = payments.data
      return entities.map((p) => ({
        id: p.id,
        status: 'captured',
        captured_amount: p.authorized_amount
      }))
    })

    const splitOrderPayments = updateSplitOrderPaymentsStep(updatePayload)
    return new WorkflowResponse(splitOrderPayments)
  }
)
