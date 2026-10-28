import { WorkflowResponse, createWorkflow, transform, when } from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"

import { JobStats } from "../../../utils/run-job"
import { syncCapturesWorkflow } from "../../captures/workflows/sync-captures"
import { processPayoutsWorkflow } from "./process-payouts"

export type ProcessPaymentCapturedPayoutsWorkflowInput = {
  payment_id: string
}

type CapturedPayment = { payment_collection_id: string; payment_collection?: { order?: { id: string } | null } | null }

export const processPaymentCapturedPayoutsWorkflowId = "process-stripe-payment-captured-payouts"

/** A captured payment closes its order group's capture and lets its order be paid out. */
export const processPaymentCapturedPayoutsWorkflow = createWorkflow(
  processPaymentCapturedPayoutsWorkflowId,
  function (input: ProcessPaymentCapturedPayoutsWorkflowInput) {
    const { data: payments } = useQueryGraphStep({
      entity: "payment",
      fields: ["id", "payment_collection_id", "payment_collection.order.id"],
      filters: { id: input.payment_id },
    }).config({ name: "captured-payment-query" })

    const payment = transform({ payments }, ({ payments }) => (payments[0] as CapturedPayment | undefined) ?? null)

    const captures = when("captured-payment-found", { payment }, ({ payment }) => !!payment).then(() => {
      const { data } = useQueryGraphStep({
        entity: "stripe_capture",
        fields: ["order_group_id"],
        filters: transform({ payment }, ({ payment }) => ({ payment_collection_id: payment?.payment_collection_id })),
      }).config({ name: "captured-payment-capture-query" })
      return data
    })

    when("captured-payment-has-capture", { captures }, ({ captures }) => !!captures?.length).then(() => {
      syncCapturesWorkflow.runAsStep({
        input: transform({ captures }, ({ captures }) => ({
          order_group_ids: (captures ?? []).map((row) => row.order_group_id as string),
        })),
      })
    })

    const orderId = transform({ payment }, ({ payment }) => payment?.payment_collection?.order?.id ?? null)

    const stats = when("captured-payment-has-order", { orderId }, ({ orderId }) => !!orderId).then(() =>
      processPayoutsWorkflow.runAsStep({
        input: transform({ orderId }, ({ orderId }) => ({ order_ids: [orderId as string] })),
      })
    )

    return new WorkflowResponse(transform({ stats }, ({ stats }) => (stats ?? {}) as JobStats))
  }
)
