import { WorkflowResponse, createWorkflow, transform, when } from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"

import { claimOperatorNotificationStep } from "../steps"
import { failedOperationNotification, failedOperationNotificationKey } from "../utils/failed-operation"
import { notifyOperatorWorkflow } from "./notify-operator"

export type FailedOperation = "payout" | "payout_reversal" | "settlement"

export type NotifyOperationFailedWorkflowInput = {
  operation: FailedOperation
  id: string
}

export const notifyOperationFailedWorkflowId = "notify-stripe-operation-failed"

/** Posts a failed payout, reversal or settlement bank payout to the operator's notification endpoint. */
export const notifyOperationFailedWorkflow = createWorkflow(
  notifyOperationFailedWorkflowId,
  function (input: NotifyOperationFailedWorkflowInput) {
    const payouts = when("failed-payout", { input }, ({ input }) => input.operation === "payout").then(() => {
      const { data } = useQueryGraphStep({
        entity: "payout",
        fields: [
          "id",
          "display_id",
          "order_id",
          "amount",
          "currency_code",
          "status",
          "status_reason",
          "data",
          "account.id",
          "account.seller.id",
        ],
        filters: { id: input.id },
      }).config({ name: "failed-payout-query" })
      return data
    })

    const reversals = when("failed-payout-reversal", { input }, ({ input }) => input.operation === "payout_reversal").then(
      () => {
        const { data } = useQueryGraphStep({
          entity: "payout_reversal",
          fields: [
            "id",
            "payout_id",
            "refund_id",
            "amount",
            "status",
            "status_reason",
            "data",
            "payout.order_id",
            "payout.currency_code",
            "payout.account.id",
            "payout.account.seller.id",
          ],
          filters: { id: input.id },
        }).config({ name: "failed-payout-reversal-query" })
        return data
      }
    )

    const settlements = when("failed-settlement", { input }, ({ input }) => input.operation === "settlement").then(() => {
      const { data } = useQueryGraphStep({
        entity: "settlement",
        fields: [
          "id",
          "display_id",
          "account_id",
          "amount",
          "currency_code",
          "period_start",
          "period_end",
          "status",
          "payout_status",
          "provider_payout_id",
          "status_reason",
          "payout_account.seller.id",
        ],
        filters: { id: input.id },
      }).config({ name: "failed-settlement-query" })
      return data
    })

    const notification = transform(
      { input, payouts, reversals, settlements },
      ({ input, payouts, reversals, settlements }) =>
        failedOperationNotification(input.operation, payouts?.[0] ?? reversals?.[0] ?? settlements?.[0] ?? null)
    )

    const claimed = when("failed-operation-found", { notification }, ({ notification }) => !!notification).then(() =>
      claimOperatorNotificationStep(
        transform({ notification }, ({ notification }) => ({
          key: failedOperationNotificationKey(notification as NonNullable<typeof notification>),
        }))
      )
    )

    const sent = when("failed-operation-claimed", { claimed }, ({ claimed }) => !!claimed).then(() =>
      notifyOperatorWorkflow.runAsStep({
        input: transform({ notification }, ({ notification }) => notification as NonNullable<typeof notification>),
      })
    )

    return new WorkflowResponse(transform({ sent }, ({ sent }) => sent ?? null))
  }
)
