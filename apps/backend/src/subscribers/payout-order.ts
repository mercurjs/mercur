import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { PayoutWorkflowEvents } from '@mercurjs/framework'

import { processPayoutForOrderWorkflow } from '../workflows/order/workflows'

/**
 * *
 * Subscriber for event: PayoutWorkflowEvents.RECEIVED. initiates payout transactions when orders are received
 * @param {SubscriberArgs} - Event data and container for the subscriber
 * @returns {Promise<void>} Resolves when the subscriber processing is complete

 */
export default async function payoutOrderHandler({
  event,
  container
}: SubscriberArgs<{
  order_id: string
}>) {
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
