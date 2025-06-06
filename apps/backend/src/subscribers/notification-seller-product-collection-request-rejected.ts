import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { ProductCollectionRequestUpdatedEvent } from '../modules/requests/types'
import { sendVendorUIRequestNotification } from '../modules/requests/utils/notifications'

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
