import { getOrdersListWorkflow } from "@medusajs/core-flows"
import type { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { MercurModules, PayoutAccountStatus, PayoutEvents } from "@mercurjs/types"

import PayoutModuleService from "../modules/payout/services/payout-module-service"

const BATCH_SIZE = 100

const DAILY_PAYOUTS_FIELDS = [
  "id",
  "metadata",
  "currency_code",
  "payment_collections.*",
  "fulfillments.*",
  "summary.*",
  "payouts.id",
  "seller.payout_account.id",
  "seller.payout_account.status",
]

export default async function dailyPayoutsJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const eventBus = container.resolve(Modules.EVENT_BUS)
  const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)

  const options = service.getOptions()

  if (options.disabled) {
    logger.warn("Daily payouts job skipped - payouts disabled")
    return
  }

  logger.info("Daily payouts job started")

  let offset = 0
  let emitted = 0

  const createdAfter = new Date(Date.now() - options.authorizationWindowMs)

  const listWorkflow = getOrdersListWorkflow(container)

  while (true) {
    const { result } = await listWorkflow.run({
      input: {
        fields: DAILY_PAYOUTS_FIELDS,
        variables: {
          filters: {
            is_draft_order: false,
            canceled_at: null,
            created_at: { $gte: createdAfter },
          },
          take: BATCH_SIZE,
          skip: offset,
          order: {
            created_at: "ASC",
          },
        },
      },
    })

    const { rows: orders } = result as {
      rows: any[];
    }

    if (!orders.length) break

    logger.debug(`Daily payouts - fetched ${orders.length} orders at offset ${offset}`)

    const events: { name: string; data: Record<string, unknown> }[] = []

    for (const order of orders) {
      if (!order.metadata?.captured) {
        logger.debug(`Order ${order.id} - skipped, not captured`)
        continue
      }

      if (order.metadata?.payout_transferred) {
        logger.debug(`Order ${order.id} - skipped, payout already transferred`)
        continue
      }

      if (order.metadata?.payout_failed) {
        logger.debug(`Order ${order.id} - skipped, payout previously failed`)
        continue
      }

      if (order.payouts?.length) {
        logger.debug(`Order ${order.id} - skipped, already has payouts`)
        continue
      }

      if (order.seller?.payout_account?.status !== PayoutAccountStatus.ACTIVE) {
        logger.debug(`Order ${order.id} - skipped, payout account not active (status: ${order.seller?.payout_account?.status})`)
        continue
      }

      logger.info(`Emitting payout transfer requested - order ${order.id}`)

      events.push({
        name: PayoutEvents.PayoutRequested,
        data: {
          order_id: order.id,
        },
      })
    }

    if (events.length) {
      await eventBus.emit(events, { attempts: 3 })
      emitted += events.length
    }

    if (orders.length < BATCH_SIZE) break
    offset += BATCH_SIZE
  }

  logger.info(`Daily payouts job completed - ${emitted} transfer(s) requested`)
}

export const config = {
  name: "daily-payouts",
  schedule: "0 1 * * *",
}
