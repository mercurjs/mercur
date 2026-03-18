import { getOrdersListWorkflow } from "@medusajs/core-flows"
import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { FulfillmentStatus, IOrderModuleService } from "@medusajs/types"
import {
  MercurModules,
  PaymentCollectionDTO,
  PayoutAccountStatus,
  PayoutEvents,
} from "@mercurjs/types"

import PayoutModuleService from "../modules/payout/services/payout-module-service"

const FULFILLMENT_STATUS_ORDER: FulfillmentStatus[] = [
  "not_fulfilled",
  "partially_fulfilled",
  "fulfilled",
  "partially_shipped",
  "shipped",
  "partially_delivered",
  "delivered",
]

function meetsRequiredFulfillmentStatus(
  status: FulfillmentStatus,
  required: FulfillmentStatus
): boolean {
  const statusIndex = FULFILLMENT_STATUS_ORDER.indexOf(status)
  const requiredIndex = FULFILLMENT_STATUS_ORDER.indexOf(required)

  return statusIndex !== -1 && statusIndex >= requiredIndex
}

const CAPTURE_CHECK_FIELDS = [
  "id",
  "display_id",
  "status",
  "email",
  "currency_code",
  "region_id",
  "customer_id",
  "sales_channel_id",
  "created_at",
  "updated_at",
  "canceled_at",
  "metadata",
  "items.*",
  "items.variant.*",
  "items.variant.product.*",
  "shipping_address.*",
  "billing_address.*",
  "shipping_methods.*",
  "payment_collections.*",
  "fulfillments.*",
  "summary.*",
  "payouts.id",
  "seller.payout_account.id",
  "seller.payout_account.status",
]

export default async function captureCheckJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const eventBus = container.resolve(Modules.EVENT_BUS)
  const orderModule = container.resolve<IOrderModuleService>(Modules.ORDER)
  const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)

  const options = service.getOptions()

  if (options.disabled) {
    logger.warn("Capture check job skipped - payouts disabled")
    return
  }

  const batchSize = 100
  const authWindowMs = options.authorizationWindowMs
  const safetyBufferMs = options.captureSafetyBufferMs
  const requiredFulfillmentStatus = options.requiredFulfillmentStatus

  logger.info("Capture check job started")
  logger.debug(
    `Capture check config - authWindowMs: ${authWindowMs}, safetyBufferMs: ${safetyBufferMs}, requiredFulfillmentStatus: ${requiredFulfillmentStatus}`
  )

  let offset = 0
  let emittedCount = 0

  const createdAfter = new Date(Date.now() - authWindowMs)

  const workflow = getOrdersListWorkflow(container)

  while (true) {
    const { result } = await workflow.run({
      input: {
        fields: CAPTURE_CHECK_FIELDS,
        variables: {
          filters: {
            is_draft_order: false,
            canceled_at: null,
            created_at: { $gte: createdAfter },
          },
          take: batchSize,
          skip: offset,
          order: {
            created_at: "ASC",
          },
        },
      },
    })

    const { rows: orders } = result as {
      rows: any[];
    };

    if (!orders.length) break

    logger.debug(`Capture check - fetched ${orders.length} orders at offset ${offset}`)

    const events: { name: string; data: Record<string, unknown> }[] = []
    const orderIdsToUpdate: string[] = []

    for (const order of orders) {
      if (order.metadata?.capture_requested) {
        logger.debug(`Order ${order.id} - skipped, capture already requested`)
        continue
      }

      if (order.payouts?.length) {
        logger.debug(`Order ${order.id} - skipped, has payouts`)
        continue
      }

      if (order.seller?.payout_account?.status !== PayoutAccountStatus.ACTIVE) {
        logger.debug(`Order ${order.id} - skipped, payout account not active`)
        continue
      }

      if (!meetsRequiredFulfillmentStatus(order.fulfillment_status, requiredFulfillmentStatus)) {
        logger.debug(`Order ${order.id} - skipped, fulfillment status ${order.fulfillment_status} below required ${requiredFulfillmentStatus}`)
        continue
      }

      if (order.payment_status !== "authorized") {
        logger.debug(`Order ${order.id} - skipped, payment status ${order.payment_status}`)
        continue
      }

      const pc = (order.payment_collections ?? []).find(
        (c: PaymentCollectionDTO) => c.status === "authorized"
      )

      if (!pc) {
        logger.debug(`Order ${order.id} - skipped, no authorized payment collection`)
        continue
      }

      const authorizedAt = new Date(pc.created_at).getTime()
      const expiresAt = authorizedAt + authWindowMs
      const captureDeadline = expiresAt - safetyBufferMs

      const now = Date.now()

      if (now >= expiresAt) {
        logger.warn(`Order ${order.id} - authorization expired at ${new Date(expiresAt).toISOString()}`)

        events.push({
          name: PayoutEvents.OrderAuthorizationExpired,
          data: {
            order_id: order.id,
            authorized_at: new Date(authorizedAt),
            expires_at: new Date(expiresAt),
          },
        })

        orderIdsToUpdate.push(order.id)
        continue
      }

      if (now < captureDeadline) {
        logger.debug(`Order ${order.id} - skipped, capture deadline not reached`)
        continue
      }

      logger.info(`Emitting capture requested - order ${order.id}`)

      events.push({
        name: PayoutEvents.OrderCaptureRequested,
        data: {
          order_id: order.id,
          authorized_at: new Date(authorizedAt),
          expires_at: new Date(expiresAt),
        },
      })

      orderIdsToUpdate.push(order.id)
    }

    if (events.length) {
      await eventBus.emit(events, { attempts: 3 })

      await orderModule.updateOrders(
        orderIdsToUpdate.map((id) => ({
          id,
          metadata: { capture_requested: true },
        }))
      )

      emittedCount += events.length
    }

    if (orders.length < batchSize) break
    offset += batchSize
  }

  logger.info(`Capture check job completed - ${emittedCount} capture(s) requested`)
}

export const config = {
  name: "capture-check",
  schedule: "*/15 * * * *",
}
