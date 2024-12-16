import { PayoutEvents } from '#/modules/payout/types'
import { processPayoutForOrderWorkflow } from '#/workflows/order/workflows'

import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { IEventBusModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

export default async function payoutOrderHandler({
  event,
  container
}: SubscriberArgs<{ order_id: string }>) {
  const eventBus: IEventBusModuleService = container.resolve(Modules.EVENT_BUS)

  try {
    const { result } = await processPayoutForOrderWorkflow(container).run({
      input: {
        order_id: event.data.order_id
      }
    })
    await eventBus.emit({
      data: {
        id: result.id,
        order_id: event.data.order_id
      },
      name: PayoutEvents.SUCCEEDED
    })
  } catch (error) {
    await eventBus.emit({
      data: {
        order_id: event.data.order_id
      },
      name: PayoutEvents.FAILED
    })

    throw error
  }
}

export const config: SubscriberConfig = {
  event: PayoutEvents.PROCESS,
  context: {
    subscriberId: 'payout-order-handler'
  }
}
