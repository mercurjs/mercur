import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import {
  PayoutWebhookActionPayload,
  PayoutWebhookEvents
} from '@mercurjs/framework'
import { PAYOUT_MODULE } from '@mercurjs/payout'
import { PayoutModuleService } from '@mercurjs/payout'

import { processPayoutWebhookActionWorkflow } from '../workflows/payout/workflows'

/**
 * *
 * @interface SerializedBuffer
 * 
 * @property {ArrayBuffer} data - The associated array buffer.
 * @property {"Buffer"} type - The type of the serialized buffer

 */
type SerializedBuffer = {
  /**
 * *
 * Represents a raw buffer of binary data, which is used to store data for the
 * different typed arrays. ArrayBuffers cannot be read from or written to directly,
 * but can be passed to a typed array or DataView Object to interpret the raw
 * buffer as needed.

 */
  data: ArrayBuffer
  type: 'Buffer'
}

/**
 * *
 * Subscriber for event: PayoutWebhookEvents.ACCOUNT_WEBHOOK_RECEIVED. "Initiates payout actions on receiving account webhook events."
 * @param {SubscriberArgs} - Event data and container for the subscriber
 * @returns {Promise<void>} Resolves when the subscriber processing is complete

 */
export default async function payoutWebhookHandler({
  event,
  container
}: SubscriberArgs<PayoutWebhookActionPayload>) {
  const payoutService: PayoutModuleService = container.resolve(PAYOUT_MODULE)

  const input = event.data

  if ((input.rawData as unknown as SerializedBuffer)?.type === 'Buffer') {
    input.rawData = Buffer.from(
      (input.rawData as unknown as SerializedBuffer).data
    )
  }

  const actionAndData = await payoutService.getWebhookActionAndData(input)

  if (!actionAndData) {
    return
  }

  await processPayoutWebhookActionWorkflow(container).run({
    input: {
      action: actionAndData.action,
      data: actionAndData.data
    }
  })
}

export const config: SubscriberConfig = {
  event: PayoutWebhookEvents.ACCOUNT_WEBHOOK_RECEIVED,
  context: {
    subscriberId: 'payout-account-webhook-handler'
  }
}
