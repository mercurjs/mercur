import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { PayoutStatus } from "@mercurjs/types"

import { resolveConnector, resolvePayoutModule } from "../../../utils/payout-module"
import { SetCheckpointsStepInput } from "../../common/steps/set-checkpoints"
import { CURSOR_ORDER, advanceCursor, afterCursor, decodeCursor, wrapCursor } from "../../common/utils/cursor"
import {
  AWAITING_ACCOUNT_CHECKPOINT_PREFIX,
  PAYOUTS_BACKLOG_CHECKPOINT,
  PAYOUTS_CHECKPOINT,
  PayoutOrderRow,
  eligiblePayoutOrders,
  ordersWithoutPayout,
} from "../utils/payout-orders"

const PAGE = 100
const ORDER_FIELDS = ["id", "created_at", "seller.metadata"]

export type SelectPayoutOrdersStepOutput = {
  order_ids: string[]
  checkpoints: SetCheckpointsStepInput
  stats: Record<string, number | string>
}

export const selectPayoutOrdersStepId = "select-stripe-payout-orders"

/**
 * The orders to pay out this run: the given ones, or the next page of held
 * or failed payouts, the orders created since the last run, and the orders a
 * seller placed before their payout account was ready. Each source pages by
 * its own checkpoint, which a graph query step cannot carry.
 */
export const selectPayoutOrdersStep = createStep(
  selectPayoutOrdersStepId,
  async (input: { order_ids?: string[] }, { container }) => {
    const connector = resolveConnector(container)
    const payoutModule = resolvePayoutModule(container)
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const stats: Record<string, number | string> = {}
    const checkpoints: SetCheckpointsStepInput = []

    if (!connector.getOptions().transfers.enabled) {
      stats.skipped = "transfers disabled"
      return new StepResponse<SelectPayoutOrdersStepOutput>({ order_ids: [], checkpoints, stats })
    }

    const loadOrders = async (ids: string[]): Promise<PayoutOrderRow[]> => {
      if (!ids.length) {
        return []
      }
      const { data } = await query.graph({ entity: "order", fields: ORDER_FIELDS, filters: { id: ids } })
      const byId = new Map((data as PayoutOrderRow[]).map((order) => [order.id, order]))
      return ids.flatMap((id) => byId.get(id) ?? [])
    }

    if (input.order_ids?.length) {
      const selection = eligiblePayoutOrders(await loadOrders(input.order_ids))
      if (selection.ignored) stats.ignored = selection.ignored
      return new StepResponse<SelectPayoutOrdersStepOutput>({ order_ids: selection.order_ids, checkpoints, stats })
    }

    const backlogCheckpoint = await connector.getCheckpoint(PAYOUTS_BACKLOG_CHECKPOINT)
    const { data: backlogRows } = await query.graph({
      entity: "payout",
      fields: ["id", "order_id", "created_at"],
      filters: {
        status: [PayoutStatus.FAILED, PayoutStatus.ON_HOLD],
        order_id: { $ne: null },
        ...afterCursor(decodeCursor(backlogCheckpoint)),
      },
      pagination: { take: PAGE, order: CURSOR_ORDER },
    })
    const backlog = backlogRows as { id: string; order_id: string; created_at: Date | string }[]
    stats.backlog = backlog.length
    checkpoints.push({ key: PAYOUTS_BACKLOG_CHECKPOINT, value: wrapCursor(backlog, PAGE) })

    const freshCheckpoint = await connector.getCheckpoint(PAYOUTS_CHECKPOINT)
    const { data: fresh } = await query.graph({
      entity: "order",
      fields: ORDER_FIELDS,
      filters: afterCursor(decodeCursor(freshCheckpoint)),
      pagination: { take: PAGE, order: CURSOR_ORDER },
    })
    stats.new_orders = fresh.length
    const freshCursor = advanceCursor(fresh as PayoutOrderRow[], freshCheckpoint)
    if (freshCursor !== freshCheckpoint) {
      checkpoints.push({ key: PAYOUTS_CHECKPOINT, value: freshCursor })
    }

    let awaitingIds: string[] = []
    const [queued] = await connector.listConnectorCheckpoints(
      { key: { $like: `${AWAITING_ACCOUNT_CHECKPOINT_PREFIX}%` }, value: { $ne: null } },
      { take: 1, order: { updated_at: "ASC" } }
    )
    if (queued) {
      const sellerId = queued.key.slice(AWAITING_ACCOUNT_CHECKPOINT_PREFIX.length)
      const { data: links } = await query.graph({
        entity: "order_seller",
        fields: ["order_id"],
        filters: { seller_id: sellerId, ...(queued.value ? { order_id: { $gt: queued.value } } : {}) },
        pagination: { take: PAGE, order: { order_id: "ASC" } },
      })
      const orderIds = links.map((link) => link.order_id as string)
      const paid = orderIds.length
        ? await payoutModule.listPayouts({ order_id: orderIds }, { take: null, select: ["order_id"] })
        : []
      awaitingIds = ordersWithoutPayout(orderIds, paid.map((payout) => payout.order_id))
      stats.awaiting_account = awaitingIds.length
      checkpoints.push({
        key: queued.key,
        value: orderIds.length < PAGE ? null : orderIds[orderIds.length - 1],
      })
    }

    const selection = eligiblePayoutOrders(
      await loadOrders(backlog.map((payout) => payout.order_id)),
      fresh as PayoutOrderRow[],
      await loadOrders(awaitingIds)
    )
    if (selection.ignored) stats.ignored = selection.ignored

    return new StepResponse<SelectPayoutOrdersStepOutput>({ order_ids: selection.order_ids, checkpoints, stats })
  }
)
