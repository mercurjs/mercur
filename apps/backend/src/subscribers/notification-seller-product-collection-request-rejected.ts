import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { ProductCollectionRequestUpdatedEvent } from '@mercurjs/framework'
import { sendVendorUIRequestNotification } from '@mercurjs/requests'

export default async function sellerProductCollectionRequestRejectedHandler({
  event,
  container
}: SubscriberArgs<{ id: string }>) {
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
