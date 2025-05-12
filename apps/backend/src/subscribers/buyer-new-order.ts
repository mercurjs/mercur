// backend/apps/backend/src/subscribers/order-created.ts
import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  Modules,
  OrderWorkflowEvents
} from '@medusajs/framework/utils'

import { ResendNotificationTemplates } from '../modules/resend/types/templates'

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
      'shipping_methods.*'
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
        order: {
          ...order,
          display_id: order.display_id,
          item_total: order.items?.length || 0
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
