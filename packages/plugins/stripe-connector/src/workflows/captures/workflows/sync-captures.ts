import { WorkflowResponse, createWorkflow, transform, when } from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"

import { CaptureDTO, OPEN_CAPTURE_STATUSES } from "../../../types/common"
import { createStripeCapturesStep, loadCaptureSourcesStep, updateStripeCapturesStep } from "../steps"
import { buildCaptureRows, planCaptureSync } from "../utils/capture-rows"

export type SyncCapturesWorkflowInput = {
  order_group_ids?: string[]
}

export const syncCapturesWorkflowId = "sync-stripe-captures"

/**
 * Writes the capture state of each order group's cart payment: the given
 * groups, or every open capture and authorized cart payment.
 */
export const syncCapturesWorkflow = createWorkflow(
  syncCapturesWorkflowId,
  function (input: SyncCapturesWorkflowInput) {
    const open = when("sync-every-open-capture", { input }, ({ input }) => !input.order_group_ids).then(() => {
      const { data } = useQueryGraphStep({
        entity: "stripe_capture",
        fields: ["payment_collection_id"],
        filters: { status: OPEN_CAPTURE_STATUSES },
      }).config({ name: "open-captures-query" })
      return data
    })

    const loaded = loadCaptureSourcesStep(
      transform({ input, open }, ({ input, open }) => ({
        order_group_ids: input.order_group_ids,
        payment_collection_ids: (open ?? []).map((row) => row.payment_collection_id as string),
      }))
    )

    const rows = transform({ loaded }, ({ loaded }) => buildCaptureRows(loaded.sources, loaded.options, new Date()))

    const existing = when("captures-to-sync", { rows }, ({ rows }) => rows.length > 0).then(() => {
      const { data } = useQueryGraphStep({
        entity: "stripe_capture",
        fields: ["*"],
        filters: transform({ rows }, ({ rows }) => ({ order_group_id: rows.map((row) => row.order_group_id) })),
      }).config({ name: "existing-captures-query" })
      return data
    })

    const plan = transform({ rows, existing }, ({ rows, existing }) =>
      planCaptureSync(rows, (existing ?? []) as unknown as CaptureDTO[])
    )

    const created = createStripeCapturesStep(plan.create)
    const updated = updateStripeCapturesStep(plan.update)

    return new WorkflowResponse(
      transform({ created, updated }, ({ created, updated }) => [...created, ...updated])
    )
  }
)
