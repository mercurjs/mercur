import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { ProductCollectionRequestUpdatedEvent } from '@mercurjs/framework'
import { sendVendorUIRequestNotification } from '@mercurjs/requests'

/**
 * *
 * Subscriber for event: ProductCollectionRequestUpdatedEvent.REJECTED. "Sends rejection notifications for product collection requests to sellers"
 * @param {SubscriberArgs} - Event data and container for the subscriber
 * @returns {Promise<void>} Resolves when the subscriber processing is complete

 */
export default async function sellerProductCollectionRequestRejectedHandler({
  event,
  container
}: SubscriberArgs<{
  id: string
}>) {
  await sendVendorUIRequestNotification({
    container,
    requestId: event.data.id,
    requestType: 'product_collection',
    template: 'seller_product_collection_request_rejected_notification'
  })
}

export const config: SubscriberConfig = {
  event: ProductCollectionRequestUpdatedEvent.REJECTED,
  context: {
    subscriberId: 'seller-product-collection-request-rejected-handler'
  }
}
