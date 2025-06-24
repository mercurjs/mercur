import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { ProductTagRequestUpdatedEvent } from '@mercurjs/framework'
import { sendVendorUIRequestNotification } from '@mercurjs/requests'

export default async function sellerProductTagRequestRejectedHandler({
  event,
  container
}: SubscriberArgs<{ id: string }>) {
  await sendVendorUIRequestNotification({
    container,
    requestId: event.data.id,
    requestType: 'product_tag',
    template: 'seller_product_tag_request_rejected_notification'
  })
}

export const config: SubscriberConfig = {
  event: ProductTagRequestUpdatedEvent.REJECTED,
  context: {
    subscriberId: 'seller-product-tag-request-rejected-handler'
  }
}
