import { PayoutEvents } from '#/modules/payout/types'

import {
  IEventBusModuleService,
  MedusaContainer
} from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

const BATCH_SIZE = 100
const RETRY_COUNT = 3

export default async function dailyPayouts(container: MedusaContainer) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const eventBus: IEventBusModuleService = container.resolve(Modules.EVENT_BUS)

  let hasMore = true

  let offset = 0

  while (hasMore) {
    // todo: filter by fulfillment status and fulfillment time
    const { data: orders } = await query.graph({
      entity: 'order',
      fields: ['id'],
      pagination: {
        order: {
          id: 'ASC'
        },
        skip: offset,
        take: BATCH_SIZE
      }
    })

    if (orders.length > 0) {
      for (const order of orders) {
        await eventBus.emit({
          data: {
            order_id: order.id
          },
          name: PayoutEvents.PROCESS,
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
