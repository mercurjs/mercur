import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { IOrderModuleService } from "@medusajs/types"
import { PayoutEvents } from "@mercurjs/types"

import { createPayoutWorkflow } from "../workflows/payout"

type PayoutRequestedData = {
  order_id: string
}

export default async function orderPayoutHandler({
  event: { data },
  container,
}: SubscriberArgs<PayoutRequestedData>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const orderModule = container.resolve<IOrderModuleService>(Modules.ORDER)

  logger.info(`Payout requested for order ${data.order_id}`)

  await createPayoutWorkflow(container).run({
    input: {
      order_id: data.order_id,
    },
  })

  await orderModule.updateOrders(data.order_id, {
    metadata: {
      payout_transferred: true,
    },
  })

  logger.info(`Payout successfully - order ${data.order_id}`)
}

export const config: SubscriberConfig = {
  event: PayoutEvents.PayoutRequested,
  context: {
    subscriberId: "order-payout-handler",
  },
}
