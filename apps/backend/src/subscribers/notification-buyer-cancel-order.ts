import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

import { ResendNotificationTemplates } from '@mercurjs/resend'

import { Hosts, buildHostAddress } from '../shared/infra/http/utils'

export default async function buyerCancelOrderHandler({
  event,
  container
}: SubscriberArgs<{ id: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [order]
  } = await query.graph({
    entity: 'order',
    fields: [
      'id',
      'email',
      'display_id',
      'items.*',
      'customer.first_name',
      'customer.last_name'
    ],
    filters: {
      id: event.data.id
    }
  })

  if (!order) {
    console.error('Order not found:', event.data.id)
    return
  }

  await notificationService.createNotifications({
    to: order.email,
    channel: 'email',
    template: ResendNotificationTemplates.BUYER_CANCELED_ORDER,
    content: {
      subject: `Your order #${order.display_id} has been canceled`
    },
    data: {
      data: {
        order: {
          id: order.id,
          display_id: order.display_id,
          item: order.items
        },
        order_address: buildHostAddress(
          Hosts.STOREFRONT,
          `/user/orders/${order.id}`
        ).toString()
      }
    }
  })
}

export const config: SubscriberConfig = {
  event: 'order.canceled',
  context: {
    subscriberId: 'notification-buyer-cancel-order'
  }
}
