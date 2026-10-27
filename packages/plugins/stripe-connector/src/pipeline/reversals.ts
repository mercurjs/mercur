import { PayoutStatus } from "@mercurjs/types"
import { createPayoutReversalsWorkflow } from "@mercurjs/core/workflows"

import { resolvePayoutModule } from "../utils/payout-module"
import { JobContext } from "../utils/run-job"

const CHUNK = 10

/**
 * Every refund on a paid-out order gets a reversal: the given orders, or
 * every order with a paid payout plus the backlog of held or failed
 * reversals.
 */
export async function processReversals(ctx: JobContext, orderIds?: string[]) {
  const { container, options, stats } = ctx

  if (!options.reversals.enabled) {
    stats.skipped = "reversals disabled"
    return
  }

  let targetOrderIds: string[]
  if (orderIds?.length) {
    targetOrderIds = orderIds
  } else {
    const payoutModule = resolvePayoutModule(container)
    const backlog = await payoutModule.listPayoutReversals(
      { status: [PayoutStatus.FAILED, PayoutStatus.ON_HOLD] },
      { take: null, select: ["payout_id"] }
    )
    const backlogPayouts = backlog.length
      ? await payoutModule.listPayouts(
          { id: Array.from(new Set(backlog.map((row) => row.payout_id))) },
          { take: null, select: ["order_id"] }
        )
      : []
    const paid = await payoutModule.listPayouts(
      { status: PayoutStatus.PAID, order_id: { $ne: null } },
      { take: null, select: ["order_id"] }
    )
    targetOrderIds = Array.from(
      new Set([...backlogPayouts, ...paid].map((row) => row.order_id).filter((id): id is string => !!id))
    )
    stats.backlog = backlog.length
  }

  let dispatched = 0
  for (let i = 0; i < targetOrderIds.length; i += CHUNK) {
    const { result } = await createPayoutReversalsWorkflow(container).run({
      input: { order_ids: targetOrderIds.slice(i, i + CHUNK) },
    })
    for (const [key, value] of Object.entries(result.counts)) {
      stats[key] = Number(stats[key] ?? 0) + value
    }
    dispatched += result.reversals.length
  }

  stats.orders = targetOrderIds.length
  stats.dispatched = dispatched
}
