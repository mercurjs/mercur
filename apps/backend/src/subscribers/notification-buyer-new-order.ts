import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  Modules,
  OrderWorkflowEvents
} from '@medusajs/framework/utils'

import { ResendNotificationTemplates } from '@mercurjs/resend'

import { Hosts, buildHostAddress } from '../shared/infra/http/utils'

export default async function orderCreatedHandler({
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
      '*',
      'customer.*',
      'items.*',
      'shipping_address.*',
      'shipping_methods.*',
      'summary.*'
    ],
    filters: {
      id: event.data.id
    }
  })

  if (!order) {
    return
  }

  await notificationService.createNotifications({
    to: order.email,
    channel: 'email',
    template: ResendNotificationTemplates.BUYER_NEW_ORDER,
    content: {
      subject: `Order Confirmation - #${order.display_id}`
    },
    data: {
      data: {
        user_name: order.customer?.first_name || 'Customer',
        order_id: order.id,
        order_address: buildHostAddress(
          Hosts.STOREFRONT,
          `/user/orders/${order.id}`
        ).toString(),
        order: {
          ...order,
          display_id: order.display_id,
          total: order.summary?.current_order_total || 0
        }
      }
    }
  })
}

export const config: SubscriberConfig = {
  event: OrderWorkflowEvents.PLACED,
  context: {
    subscriberId: 'order-created-handler'
  }
}
