import { WorkflowResponse, createWorkflow, transform, when } from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"

import { syncCapturesWorkflow } from "../../captures/workflows/sync-captures"
import { processPayoutsWorkflow } from "./process-payouts"

export type ProcessOrderChangedPayoutsWorkflowInput = {
  order_id: string
}

export const processOrderChangedPayoutsWorkflowId = "process-stripe-order-changed-payouts"

/** A fulfilled or canceled order refreshes its group's capture and re-decides its payout. */
export const processOrderChangedPayoutsWorkflow = createWorkflow(
  processOrderChangedPayoutsWorkflowId,
  function (input: ProcessOrderChangedPayoutsWorkflowInput) {
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: ["id", "order_group.id"],
      filters: { id: input.order_id },
    }).config({ name: "changed-order-query" })

    const orderGroupId = transform({ orders }, ({ orders }) =>
      ((orders[0] as { order_group?: { id: string } | null } | undefined)?.order_group?.id ?? null)
    )

    when("changed-order-in-group", { orderGroupId }, ({ orderGroupId }) => !!orderGroupId).then(() => {
      syncCapturesWorkflow.runAsStep({
        input: transform({ orderGroupId }, ({ orderGroupId }) => ({ order_group_ids: [orderGroupId as string] })),
      })
    })

    const stats = processPayoutsWorkflow.runAsStep({
      input: transform({ input }, ({ input }) => ({ order_ids: [input.order_id] })),
    })

    return new WorkflowResponse(stats)
  }
)
