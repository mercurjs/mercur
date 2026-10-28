import { BigNumberInput } from "@medusajs/framework/types"
import { MathBN } from "@medusajs/framework/utils"
import { WorkflowResponse, createWorkflow, transform, when } from "@medusajs/framework/workflows-sdk"
import { cancelPaymentStep, useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { capturePaymentWorkflow } from "@mercurjs/core/workflows"

import { CaptureDTO, CaptureStatus } from "../../../types/common"
import { captureStripePaymentIntentStep, updateStripeCapturesStep, validateCaptureSettleableStep } from "../steps"
import { CaptureAction } from "../utils/capture-action"

export type SettleStripeCaptureWorkflowInput = {
  order_group_id: string
  action: CaptureAction
}

export const settleStripeCaptureWorkflowId = "settle-stripe-capture"

/** Captures the decided amount of an order group's cart payment, or releases it. */
export const settleStripeCaptureWorkflow = createWorkflow(
  settleStripeCaptureWorkflowId,
  function (input: SettleStripeCaptureWorkflowInput) {
    const { data: captures } = useQueryGraphStep({
      entity: "stripe_capture",
      fields: ["id", "status", "payment_id", "authorized_amount", "capturable_amount"],
      filters: { order_group_id: input.order_group_id },
    }).config({ name: "settle-capture-query" })

    const capture = transform({ captures }, ({ captures }) => captures[0] as unknown as CaptureDTO | undefined)

    validateCaptureSettleableStep(
      transform({ input, capture }, ({ input, capture }) => ({
        order_group_id: input.order_group_id,
        action: input.action,
        capture: capture ? { status: capture.status, capturable_amount: Number(capture.capturable_amount) } : null,
      }))
    )

    const paymentFilter = transform({ capture }, ({ capture }) => ({ id: capture!.payment_id }))

    const { data: payment } = useQueryGraphStep({
      entity: "payment",
      fields: ["id", "currency_code", "data"],
      filters: paymentFilter,
      options: { isList: false, throwIfKeyNotFound: true },
    }).config({ name: "settle-capture-payment-query" })

    const partial = transform(
      { input, capture },
      ({ input, capture }) => input.action === "capture" && MathBN.lt(capture!.capturable_amount, capture!.authorized_amount)
    )

    when("capture-stripe-payment-intent", { partial }, ({ partial }) => partial).then(() => {
      captureStripePaymentIntentStep(
        transform({ capture, payment }, ({ capture, payment }) => ({
          capture_id: capture!.id,
          payment_intent_id: (payment.data as { id: string }).id,
          currency_code: payment.currency_code,
          capturable_amount: capture!.capturable_amount,
        }))
      )
    })

    // Read after the Stripe capture: its payment_intent.succeeded webhook may have recorded it already.
    const { data: recordedPayment } = useQueryGraphStep({
      entity: "payment",
      fields: ["id", "captures.amount", "captures.raw_amount"],
      filters: paymentFilter,
      options: { isList: false, throwIfKeyNotFound: true },
    }).config({ name: "settle-capture-recorded-query" })

    const recorded = transform({ recordedPayment }, ({ recordedPayment }) =>
      ((recordedPayment.captures ?? []) as { amount: BigNumberInput; raw_amount?: BigNumberInput | null }[]).reduce<BigNumberInput>(
        (sum, row) => MathBN.add(sum, row.raw_amount ?? row.amount),
        0
      )
    )

    when("record-cart-payment-capture", { input, capture, recorded }, ({ input, capture, recorded }) =>
      input.action === "capture" && MathBN.lt(recorded, capture!.capturable_amount)
    ).then(() => {
      capturePaymentWorkflow.runAsStep({
        input: transform({ capture }, ({ capture }) => ({
          payment_id: capture!.payment_id,
          amount: capture!.capturable_amount,
        })),
      })
    })

    when("cancel-cart-payment", { input }, ({ input }) => input.action === "cancel").then(() => {
      cancelPaymentStep({ paymentIds: transform({ capture }, ({ capture }) => capture!.payment_id) })
    })

    const updated = updateStripeCapturesStep(
      transform({ input, capture }, ({ input, capture }) => [
        {
          id: capture!.id,
          status: input.action === "capture" ? CaptureStatus.CAPTURED : CaptureStatus.CANCELED,
          status_reason: null,
        },
      ])
    )

    return new WorkflowResponse(transform({ updated }, ({ updated }) => updated[0]))
  }
)
