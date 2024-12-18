import { PayoutWorkflowEvents } from '#/modules/payout/types'

import {
  IEventBusModuleService,
  MedusaContainer
} from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

const BATCH_SIZE = 100
const RETRY_COUNT = 3

export default async function dailyPayoutsJob(container: MedusaContainer) {
  const pgConnection = container.resolve(
    ContainerRegistrationKeys.PG_CONNECTION
  )
  const eventBus: IEventBusModuleService = container.resolve(Modules.EVENT_BUS)

  let hasMore = true

  let offset = 0

  while (hasMore) {
    const orders = await pgConnection
      .select('order.id')
      .from('order')
      .leftJoin('order_payout', 'order.id', 'order_payout.order_id')
      .whereNull('order_payout.order_id')
      .limit(BATCH_SIZE)
      .offset(offset)

    if (orders.length > 0) {
      for (const order of orders) {
        await eventBus.emit({
          data: {
            order_id: order.id
          },
          name: PayoutWorkflowEvents.RECEIVED,
          options: {
            attempts: RETRY_COUNT
          }
        })
      }

      offset = offset + orders.length
    } else {
      hasMore = false
    }
  }
}

export const config = {
  name: 'daily-payouts',
  schedule: '0 0 * * *' // Every day at midnight
}
