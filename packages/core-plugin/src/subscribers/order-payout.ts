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
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  logger.info(`Payout requested for order ${data.order_id}`)

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "metadata", "payouts.id"],
    filters: { id: data.order_id },
  })

  const order = orders[0]

  if (!order) {
    logger.error(`Order not found - ${data.order_id}`)
    return
  }

  if ((order as any).payouts?.length) {
    logger.warn(`Order ${data.order_id} - skipped, payout already exists`)
    return
  }

  if (!order.metadata?.captured) {
    logger.warn(`Order ${data.order_id} - skipped, not captured`)
    return
  }

  if (order.metadata?.payout_transferred) {
    logger.warn(`Order ${data.order_id} - skipped, payout already transferred`)
    return
  }

  if (order.metadata?.payout_failed) {
    logger.warn(`Order ${data.order_id} - skipped, payout previously failed`)
    return
  }

  try {
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
  } catch (error) {
    logger.error(
      `Failed to create payout - order ${data.order_id}`, error
    )

    await orderModule.updateOrders(data.order_id, {
      metadata: {
        payout_failed: true,
      },
    })

    logger.debug(`Marked payout_failed on order ${data.order_id}`)
  }
}

export const config: SubscriberConfig = {
  event: PayoutEvents.PayoutRequested,
  context: {
    subscriberId: "order-payout-handler",
  },
}
