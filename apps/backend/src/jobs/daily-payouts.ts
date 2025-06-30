import {
  IEventBusModuleService,
  MedusaContainer,
  Message
} from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

import { PayoutWorkflowEvents } from '@mercurjs/framework'

const BATCH_SIZE = 100
const RETRY_COUNT = 3
const DELAY_MS = 1200

export default async function dailyPayoutsJob(container: MedusaContainer) {
  const pgConnection = container.resolve(
    ContainerRegistrationKeys.PG_CONNECTION
  )
  const eventBus: IEventBusModuleService = container.resolve(Modules.EVENT_BUS)

  let hasMore = true
  let offset = 0

  const events: Message<{ order_id: string }>[] = []

  while (hasMore) {
    const orders = await pgConnection
      .select('order.id')
      .from('order')
      .leftJoin('order_payout', 'order.id', 'order_payout.order_id')
      .whereNull('order_payout.order_id')
      .limit(BATCH_SIZE)
      .offset(offset)

    if (orders.length > 0) {
      let order_count = 0
      for (const order of orders) {
        events.push({
          data: {
            order_id: order.id
          },
          name: PayoutWorkflowEvents.RECEIVED,
          options: {
            attempts: RETRY_COUNT,
            delay: (DELAY_MS * order_count * offset) / BATCH_SIZE
          }
        })
        order_count++
      }

      offset = offset + orders.length
    } else {
      hasMore = false
    }
  }

  await eventBus.emit(events, { delay: DELAY_MS })
}

export const config = {
  name: 'daily-payouts',
  schedule: '0 0 * * *' // Every day at midnight
}
