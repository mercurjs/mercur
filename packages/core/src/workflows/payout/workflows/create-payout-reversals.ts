import {
  WorkflowResponse,
  createWorkflow,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep, useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { PayoutDTO, PayoutModuleEvents, PayoutReversalDTO, PayoutStatus } from "@mercurjs/types"

import { createPayoutReversalsStep, processPayoutReversalsStep, updatePayoutReversalsStep } from "../steps"
import {
  CommissionLine,
  PayoutOrder,
  REVERSAL_ORDER_FIELDS,
  commissionLineFilters,
  planPayoutReversals,
} from "../utils/payout-amounts"
import { failedReversalEvents } from "./process-payout-reversal"

export type CreatePayoutReversalsWorkflowInput = {
  order_ids: string[]
}

export type CreatePayoutReversalsWorkflowOutput = {
  counts: Record<string, number>
  reversals: PayoutReversalDTO[]
}

export const createPayoutReversalsWorkflowId = "create-payout-reversals"

/**
 * Takes the refunded share back from the seller: one reversal per refund on
 * an order whose payout is paid, net of the commission on that share.
 */
export const createPayoutReversalsWorkflow = createWorkflow(
  createPayoutReversalsWorkflowId,
  function (input: CreatePayoutReversalsWorkflowInput) {
    const loaded = when("orders-to-reverse", { input }, ({ input }) => input.order_ids.length > 0).then(() => {
      const { data: orders } = useQueryGraphStep({
        entity: "order",
        fields: REVERSAL_ORDER_FIELDS,
        filters: { id: input.order_ids },
      }).config({ name: "reversal-orders-query" })

      const { data: payouts } = useQueryGraphStep({
        entity: "payout",
        fields: ["*", "reversals.*"],
        filters: { order_id: input.order_ids },
      }).config({ name: "reversal-payouts-query" })

      return transform({ orders, payouts }, ({ orders, payouts }) => ({
        orders: orders as unknown as PayoutOrder[],
        payouts: payouts as unknown as (PayoutDTO & { reversals?: PayoutReversalDTO[] })[],
      }))
    })

    const commissionFilters = transform({ loaded }, ({ loaded }) => commissionLineFilters(loaded?.orders ?? []))

    const commissionLines = when(
      "reversal-orders-with-commission-lines",
      { commissionFilters },
      ({ commissionFilters }) => commissionFilters.$or.length > 0
    ).then(() => {
      const { data } = useQueryGraphStep({
        entity: "commission_line",
        fields: ["amount", "item_id", "shipping_method_id"],
        filters: commissionFilters,
      }).config({ name: "reversal-commission-lines-query" })

      return data
    })

    const plan = transform({ loaded, commissionLines }, ({ loaded, commissionLines }) =>
      planPayoutReversals({
        orders: loaded?.orders ?? [],
        payouts: loaded?.payouts ?? [],
        commission_lines: (commissionLines ?? []) as unknown as CommissionLine[],
      })
    )

    const created = createPayoutReversalsStep(transform({ plan }, ({ plan }) => plan.create))
    const updated = updatePayoutReversalsStep(transform({ plan }, ({ plan }) => plan.update))

    const pendingIds = transform({ created, updated }, ({ created, updated }) =>
      [...created, ...updated]
        .filter((reversal) => reversal.status === PayoutStatus.PENDING)
        .map((reversal) => reversal.id)
    )
    const reversals = processPayoutReversalsStep({ ids: pendingIds })

    emitEventStep({
      eventName: PayoutModuleEvents.PAYOUT_REVERSAL_FAILED,
      data: transform({ reversals }, ({ reversals }) => failedReversalEvents(reversals)),
    })

    return new WorkflowResponse(
      transform({ plan, reversals }, ({ plan, reversals }): CreatePayoutReversalsWorkflowOutput => ({
        counts: plan.counts,
        reversals,
      }))
    )
  }
)
