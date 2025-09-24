import {
  IEventBusModuleService,
  MedusaContainer,
  Message
} from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

import { PayoutAccountStatus, PayoutSummaryEvents } from '@mercurjs/framework'

export default async function dailyPayoutsSummaryJob(
  container: MedusaContainer
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const eventBus: IEventBusModuleService = container.resolve(Modules.EVENT_BUS)

  const { data: payout_accounts } = await query.graph({
    entity: 'payout_account',
    fields: ['id', 'seller.id', 'seller.email', 'seller.name'],
    filters: {
      status: PayoutAccountStatus.ACTIVE
    }
  })

  const to_date = new Date()
  const from_date = new Date(to_date.getTime() - 24 * 60 * 60 * 1000)
  const events: Message[] = []

  for (const payout_account of payout_accounts) {
    const { data: payouts } = await query.graph({
      entity: 'payout',
      fields: [
        'id',
        'created_at',
        'amount',
        'currency_code',
        'order.id',
        'order.created_at',
        'order.display_id'
      ],
      filters: {
        payout_account_id: payout_account.id,
        created_at: {
          $gte: from_date,
          $lte: to_date
        }
      }
    })

    if (payouts.length > 0) {
      events.push({
        name: PayoutSummaryEvents.NOTIFICATION_SENT,
        data: {
          seller: payout_account.seller,
          payouts
        }
      })
    }
  }

  await eventBus.emit(events)
}

export const config = {
  name: 'daily-payouts-summary',
  schedule: '0 8 * * *' // Every day at 8 AM
}
