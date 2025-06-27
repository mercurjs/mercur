import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { ProductCategoryRequestUpdatedEvent } from '@mercurjs/framework'
import { sendVendorUIRequestNotification } from '@mercurjs/requests'

export default async function sellerProductCategoryRequestRejectedHandler({
  event,
  container
}: SubscriberArgs<{ id: string }>) {
  await sendVendorUIRequestNotification({
    container,
    requestId: event.data.id,
    requestType: 'product_category',
    template: 'seller_product_category_request_rejected_notification'
  })
}

export const config: SubscriberConfig = {
  event: ProductCategoryRequestUpdatedEvent.REJECTED,
  context: {
    subscriberId: 'seller-product-category-request-rejected-handler'
  }
}
