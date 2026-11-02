import { WorkflowResponse, createWorkflow, transform } from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { PayoutStatus } from "@mercurjs/types"

import { CaptureStatus } from "../../../types/common"
import { JobStats } from "../../../utils/run-job"
import { resolveAlertingStep, sendOperatorEmailsStep } from "../../common/steps"
import { FailedOperations, countFailedOperations, failedOperationsNotifications } from "../utils/failed-operations"

export const alertFailedOperationsWorkflowId = "alert-stripe-failed-operations"

/** Mails the operator the daily digest of captures, payouts, reversals, settlements and adjustments that failed. */
export const alertFailedOperationsWorkflow = createWorkflow(alertFailedOperationsWorkflowId, function () {
  const { data: captures } = useQueryGraphStep({
    entity: "stripe_capture",
    fields: ["order_group_id", "payment_id", "status_reason"],
    filters: { status: CaptureStatus.FAILED },
  }).config({ name: "failed-captures-query" })

  const { data: payouts } = useQueryGraphStep({
    entity: "payout",
    fields: ["id", "order_id", "amount", "currency_code", "status_reason"],
    filters: { status: PayoutStatus.FAILED },
  }).config({ name: "failed-payouts-query" })

  const { data: reversals } = useQueryGraphStep({
    entity: "payout_reversal",
    fields: ["id", "payout_id", "refund_id", "amount", "status_reason"],
    filters: { status: PayoutStatus.FAILED },
  }).config({ name: "failed-reversals-query" })

  const { data: settlements } = useQueryGraphStep({
    entity: "settlement",
    fields: ["id", "account_id", "amount", "currency_code", "status_reason"],
    filters: { payout_status: PayoutStatus.FAILED },
  }).config({ name: "failed-settlements-query" })

  const { data: adjustments } = useQueryGraphStep({
    entity: "adjustment",
    fields: ["id", "account_id", "amount", "currency_code", "status_reason"],
    filters: { status: PayoutStatus.FAILED },
  }).config({ name: "failed-adjustments-query" })

  const alerting = resolveAlertingStep()

  const failed = transform(
    { captures, payouts, reversals, settlements, adjustments },
    ({ captures, ...rest }) =>
      ({
        ...rest,
        captures: captures.map((row) => ({
          order_group_id: row.order_group_id,
          payment_id: row.payment_id,
          error: row.status_reason,
        })),
      }) as unknown as FailedOperations
  )

  const notifications = transform({ failed, alerting }, ({ failed, alerting }) =>
    failedOperationsNotifications(failed, alerting)
  )

  const sent = sendOperatorEmailsStep(notifications)

  const stats = transform({ failed, sent }, ({ failed, sent }): JobStats => ({
    captures: failed.captures.length,
    payouts: failed.payouts.length,
    reversals: failed.reversals.length,
    settlements: failed.settlements.length,
    adjustments: failed.adjustments.length,
    total: countFailedOperations(failed),
    sent,
  }))

  return new WorkflowResponse(stats)
})
