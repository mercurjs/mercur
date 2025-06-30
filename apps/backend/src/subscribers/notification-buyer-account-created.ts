import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

import { ResendNotificationTemplates } from '@mercurjs/resend'

export default async function buyerAccountCreatedHandler({
  event,
  container
}: SubscriberArgs<{ id: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [customer]
  } = await query.graph({
    entity: 'customer',
    fields: ['id', 'email', 'first_name', 'last_name'],
    filters: {
      id: event.data.id
    }
  })

  if (!customer) {
    console.error('Customer not found:', event.data.id)
    return
  }

  await notificationService.createNotifications({
    to: customer.email,
    channel: 'email',
    template: ResendNotificationTemplates.BUYER_ACCOUNT_CREATED,
    content: {
      subject: `Welcome to Mercur, ${customer.first_name || ''}!`
    },
    data: {
      data: {
        user_name: customer.first_name || 'Customer'
      }
    }
  })
}

export const config: SubscriberConfig = {
  event: 'customer.created',
  context: {
    subscriberId: 'buyer-account-created-handler'
  }
}
