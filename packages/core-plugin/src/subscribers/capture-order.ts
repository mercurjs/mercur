import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { capturePaymentWorkflow } from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { IOrderModuleService, PaymentCollectionDTO } from "@medusajs/types"
import { PayoutEvents } from "@mercurjs/types"

export default async function captureOrderHandler({
  event: { data },
  container,
}: SubscriberArgs<{
  order_id: string
  authorized_at: Date
  expires_at: Date
}>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  logger.info(`Capture requested for order ${data.order_id}`)
  logger.debug(
    `Order ${data.order_id} - authorized_at: ${data.authorized_at}, expires_at: ${data.expires_at}`
  )

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "metadata",
      "payment_collections.payments.id",
      "payment_collections.payments.captured_at",
    ],
    filters: {
      id: data.order_id,
    },
  })

  const order = orders[0]

  if (!order) {
    logger.error(`Order not found - ${data.order_id}`)
    return
  }

  if (order.metadata?.captured) {
    logger.warn(`Order ${data.order_id} - skipped, already captured`)
    return
  }

  if (order.metadata?.capture_failed) {
    logger.warn(`Order ${data.order_id} - skipped, capture previously failed`)
    return
  }

  const payments = order.payment_collections?.flatMap(
    (pc: PaymentCollectionDTO) => pc.payments ?? []
  )

  logger.debug(
    `Order ${data.order_id} - found ${payments?.length ?? 0} payment(s)`
  )

  const payment = payments?.find((p: any) => !p.captured_at)

  if (!payment) {
    logger.warn(`No uncaptured payment found for order - ${data.order_id}`)
    return
  }

  try {
    await capturePaymentWorkflow(container).run({
      input: {
        payment_id: payment.id,
      },
    })

    const orderModule = container.resolve<IOrderModuleService>(Modules.ORDER)

    await orderModule.updateOrders(data.order_id, {
      metadata: {
        captured: true,
      },
    })

    logger.info(
      `Payment captured successfully - ${payment.id} - order ${data.order_id}`
    )
  } catch (error) {
    logger.error(
      `Failed to capture payment - ${payment.id} - order ${data.order_id} - ${error}`
    )

    const orderModule = container.resolve<IOrderModuleService>(Modules.ORDER)

    await orderModule.updateOrders(data.order_id, {
      metadata: {
        capture_failed: true,
      },
    })

    logger.debug(
      `Marked capture_failed on order ${data.order_id}`
    )
  }
}

export const config: SubscriberConfig = {
  event: PayoutEvents.OrderCaptureRequested,
  context: {
    subscriberId: "capture-order-handler",
  },
}
