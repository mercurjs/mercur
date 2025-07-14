import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

import { ProductRequestUpdatedEvent } from '@mercurjs/framework'
import { sendVendorUIRequestNotification } from '@mercurjs/requests'
import { ResendNotificationTemplates } from '@mercurjs/resend'

/**
 * *
 * Subscriber for event: ProductRequestUpdatedEvent.REJECTED. Alerts sellers via email when their product submission is rejected.
 * @param {SubscriberArgs} - Event data and container for the subscriber
 * @returns {Promise<void>} Resolves when the subscriber processing is complete

 */
export default async function sellerProductRequestRejectedHandler({
  event,
  container
}: SubscriberArgs<{
  id: string
}>) {
  const notificationService = container.resolve(Modules.NOTIFICATION)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [productRequest]
  } = await query.graph({
    entity: 'request',
    fields: ['*'],
    filters: {
      id: event.data.id
    }
  })

  if (!productRequest || productRequest.type !== 'product') {
    return
  }

  const {
    data: [member]
  } = await query.graph({
    entity: 'member',
    fields: ['*'],
    filters: {
      id: productRequest.submitter_id
    }
  })

  if (!member || !member.email) {
    return
  }

  await sendVendorUIRequestNotification({
    container,
    requestId: event.data.id,
    requestType: 'product',
    template: 'seller_product_request_rejected_notification'
  })

  await notificationService.createNotifications({
    to: member.email,
    channel: 'email',
    template: ResendNotificationTemplates.SELLER_PRODUCT_REJECTED,
    content: {
      subject: 'Mercur - Product rejected!'
    },
    data: { data: { product_title: productRequest.data.title } }
  })
}

export const config: SubscriberConfig = {
  event: ProductRequestUpdatedEvent.REJECTED,
  context: {
    subscriberId: 'seller-product-request-rejected-handler'
  }
}
