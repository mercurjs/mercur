import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { Modules } from '@medusajs/framework/utils'

import { PayoutSummaryEvents } from '@mercurjs/framework'
import { ResendNotificationTemplates } from '@mercurjs/resend'

/**
 * *
 * Subscriber for event: PayoutSummaryEvents.NOTIFICATION_SENT. Alerts sellers about their payout summaries through email notifications.
 * @param {SubscriberArgs} - Event data and container for the subscriber
 * @returns {Promise<void>} Resolves when the subscriber processing is complete

 */
export default async function notificationSellerPayoutSummary({
  event,
  container
}: SubscriberArgs<{
  seller: any
  payouts: any
}>) {
  const { seller, payouts } = event.data
  const notificationService = container.resolve(Modules.NOTIFICATION)
  await notificationService.createNotifications([
    {
      to: seller.email,
      channel: 'email',
      template: ResendNotificationTemplates.SELLER_PAYOUT_SUMMARY,
      content: {
        subject: `Payout summary for ${seller.name}`
      },
      data: {
        data: {
          seller,
          payouts
        }
      }
    }
  ])
}

export const config: SubscriberConfig = {
  event: PayoutSummaryEvents.NOTIFICATION_SENT,
  context: {
    subscriberId: 'notification-seller-payout-summary'
  }
}
