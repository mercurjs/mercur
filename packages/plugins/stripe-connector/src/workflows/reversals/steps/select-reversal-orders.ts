import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { PayoutStatus } from "@mercurjs/types"

import { resolveConnector } from "../../../utils/payout-module"
import { SetCheckpointsStepInput } from "../../common/steps/set-checkpoints"
import { CURSOR_ORDER, CursorRow, advanceCursor, afterCursor, decodeCursor, wrapCursor } from "../../common/utils/cursor"

export const REVERSALS_CHECKPOINT = "reversals"
export const REVERSALS_BACKLOG_CHECKPOINT = "reversals_backlog"

const PAGE = 100

type RefundRow = CursorRow & { payment?: { payment_collection?: { order?: { id: string } | null } | null } | null }
type ReversalRow = CursorRow & { payout?: { order_id: string | null } | null }

export type SelectReversalOrdersStepOutput = {
  order_ids: string[]
  checkpoints: SetCheckpointsStepInput
  stats: Record<string, number | string>
}

export const selectReversalOrdersStepId = "select-stripe-reversal-orders"

/**
 * The orders to reverse payouts for this run: the given ones, or the orders
 * of refunds created since the last run plus a page of failed or held
 * reversals. Each source pages by its own checkpoint, which a graph query
 * step cannot carry.
 */
export const selectReversalOrdersStep = createStep(
  selectReversalOrdersStepId,
  async (input: { order_ids?: string[] }, { container }) => {
    const connector = resolveConnector(container)
    const stats: Record<string, number | string> = {}
    const checkpoints: SetCheckpointsStepInput = []

    if (!connector.getOptions().reversals.enabled) {
      stats.skipped = "reversals disabled"
      return new StepResponse<SelectReversalOrdersStepOutput>({ order_ids: [], checkpoints, stats })
    }

    if (input.order_ids?.length) {
      return new StepResponse<SelectReversalOrdersStepOutput>({ order_ids: input.order_ids, checkpoints, stats })
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const refundCheckpoint = await connector.getCheckpoint(REVERSALS_CHECKPOINT)
    const { data: refunds } = await query.graph({
      entity: "refund",
      fields: ["id", "created_at", "payment.payment_collection.order.id"],
      filters: afterCursor(decodeCursor(refundCheckpoint)),
      pagination: { take: PAGE, order: CURSOR_ORDER },
    })
    const refundRows = refunds as unknown as RefundRow[]
    stats.refunds = refundRows.length
    const refundCursor = advanceCursor(refundRows, refundCheckpoint)
    if (refundCursor !== refundCheckpoint) {
      checkpoints.push({ key: REVERSALS_CHECKPOINT, value: refundCursor })
    }

    const backlogCheckpoint = await connector.getCheckpoint(REVERSALS_BACKLOG_CHECKPOINT)
    const { data: backlog } = await query.graph({
      entity: "payout_reversal",
      fields: ["id", "created_at", "payout.order_id"],
      filters: {
        status: [PayoutStatus.FAILED, PayoutStatus.ON_HOLD],
        ...afterCursor(decodeCursor(backlogCheckpoint)),
      },
      pagination: { take: PAGE, order: CURSOR_ORDER },
    })
    const backlogRows = backlog as unknown as ReversalRow[]
    stats.backlog = backlogRows.length
    checkpoints.push({ key: REVERSALS_BACKLOG_CHECKPOINT, value: wrapCursor(backlogRows, PAGE) })

    const orderIds = [
      ...refundRows.map((refund) => refund.payment?.payment_collection?.order?.id),
      ...backlogRows.map((reversal) => reversal.payout?.order_id),
    ].filter((id): id is string => !!id)

    return new StepResponse<SelectReversalOrdersStepOutput>({
      order_ids: Array.from(new Set(orderIds)),
      checkpoints,
      stats,
    })
  }
)
