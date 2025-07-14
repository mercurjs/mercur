import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { ProductCategoryRequestUpdatedEvent } from '@mercurjs/framework'
import { sendVendorUIRequestNotification } from '@mercurjs/requests'

/**
 * *
 * Subscriber for event: ProductCategoryRequestUpdatedEvent.ACCEPTED. Activates vendor UI notifications when a product category request is accepted.
 * @param {SubscriberArgs} - Event data and container for the subscriber
 * @returns {Promise<void>} Resolves when the subscriber processing is complete

 */
export default async function sellerProductCategoryRequestAcceptedHandler({
  event,
  container
}: SubscriberArgs<{
  id: string
}>) {
  await sendVendorUIRequestNotification({
    container,
    requestId: event.data.id,
    requestType: 'product_category',
    template: 'seller_product_category_request_accepted_notification'
  })
}

export const config: SubscriberConfig = {
  event: ProductCategoryRequestUpdatedEvent.ACCEPTED,
  context: {
    subscriberId: 'seller-product-category-request-accepted-handler'
  }
}
