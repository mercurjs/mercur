import { PayoutStatus } from "@mercurjs/types"
import {
  StepResponse,
  WorkflowResponse,
  createStep,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { createPayoutReversalsWorkflow } from "@mercurjs/core/workflows"

import { resolveConnector, resolvePayoutModule } from "../../../utils/payout-module"
import { JobStats } from "../../../utils/run-job"

export type ProcessReversalsWorkflowInput = {
  order_ids?: string[]
}

const selectReversalOrdersStep = createStep(
  "select-stripe-reversal-orders",
  async (input: ProcessReversalsWorkflowInput, { container }) => {
    const stats: Record<string, number | string> = {}

    if (!resolveConnector(container).getOptions().reversals.enabled) {
      stats.skipped = "reversals disabled"
      return new StepResponse({ order_ids: [] as string[], stats })
    }

    if (input.order_ids?.length) {
      return new StepResponse({ order_ids: input.order_ids, stats })
    }

    const payoutModule = resolvePayoutModule(container)
    const backlog = await payoutModule.listPayoutReversals(
      { status: [PayoutStatus.FAILED, PayoutStatus.ON_HOLD] },
      { take: null, select: ["payout_id"] }
    )
    stats.backlog = backlog.length

    const payouts = await payoutModule.listPayouts(
      {
        order_id: { $ne: null },
        $or: [
          { status: PayoutStatus.PAID },
          ...(backlog.length ? [{ id: Array.from(new Set(backlog.map((row) => row.payout_id))) }] : []),
        ],
      },
      { take: null, select: ["order_id"] }
    )

    return new StepResponse({
      order_ids: Array.from(new Set(payouts.map((row) => row.order_id as string))),
      stats,
    })
  }
)

export const processReversalsWorkflowId = "process-stripe-reversals"

/** Takes refunded shares back from sellers through core's reversal workflow. */
export const processReversalsWorkflow = createWorkflow(
  processReversalsWorkflowId,
  function (input: ProcessReversalsWorkflowInput) {
    const selection = selectReversalOrdersStep(input)

    const reversalsInput = transform({ selection }, ({ selection }) => ({ order_ids: selection.order_ids }))
    const reversals = createPayoutReversalsWorkflow.runAsStep({ input: reversalsInput })

    const stats = transform({ selection, reversals }, ({ selection, reversals }): JobStats => ({
      ...selection.stats,
      ...reversals.counts,
      orders: selection.order_ids.length,
      dispatched: reversals.reversals.length,
    }))

    return new WorkflowResponse(stats)
  }
)
