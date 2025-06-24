import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'

import { OrderSetWorkflowEvents } from '@mercurjs/framework'

export default async function newOrderSetAdminNotifyHandler({
  event,
  container
}: SubscriberArgs<{ id: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { id: orderSetId } = event.data

  const {
    data: [order_set]
  } = await query.graph({
    entity: 'order_set',
    fields: ['orders.id'],
    filters: {
      id: orderSetId
    }
  })

  if (!order_set || order_set.orders.length < 2) {
    return
  }

  await notificationService.createNotifications({
    to: '',
    channel: 'feed',
    template: 'admin-ui',
    content: {
      subject: `New Order Set Placed`
    },
    data: {
      title: `New order set placed`,
      description: 'Someone has placed a new order from multiple sellers 🔔',
      redirect: '/admin/orders'
    }
  })
}

export const config: SubscriberConfig = {
  event: OrderSetWorkflowEvents.PLACED,
  context: {
    subscriberId: 'new-order-set-admin-notify-handler'
  }
}
