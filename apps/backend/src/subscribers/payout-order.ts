import { PayoutWorkflowEvents } from '#/modules/payout/types'
import { processPayoutForOrderWorkflow } from '#/workflows/order/workflows'

import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

export default async function payoutOrderHandler({
  event,
  container
}: SubscriberArgs<{ order_id: string }>) {
  await processPayoutForOrderWorkflow(container).run({
    input: {
      order_id: event.data.order_id
    },
    context: {
      transactionId: event.data.order_id
    }
  })
}

export const config: SubscriberConfig = {
  event: PayoutWorkflowEvents.RECEIVED,
  context: {
    subscriberId: 'payout-order-handler'
  }
}
