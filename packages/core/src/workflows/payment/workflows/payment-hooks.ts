import type { BigNumberInput, PaymentDTO } from "@medusajs/framework/types"
import type { Hook, ReturnWorkflow } from "@medusajs/framework/workflows-sdk"
import {
  capturePaymentWorkflow as medusaCapturePaymentWorkflow,
  refundPaymentWorkflow as medusaRefundPaymentWorkflow,
  type CapturePaymentWorkflowInput,
  type RefundPaymentWorkflowInput,
} from "@medusajs/medusa/core-flows"

export type CapturePaymentWorkflowHooks = [
  Hook<
    "paymentCaptured",
    {
      payment: PaymentDTO
      order_id: string | null
      amount: BigNumberInput | null
    },
    unknown
  >,
]

export type RefundPaymentWorkflowHooks = [
  Hook<
    "paymentRefunded",
    {
      payment: PaymentDTO
      order_id: string | null
      amount: BigNumberInput | null
      credit_line_amount: BigNumberInput
      refund_reason: { id: string; label: string; code: string | null } | null
    },
    unknown
  >,
]

// The hooks come from the core-flows payment-hooks patch, which is applied in
// memory and cannot reach Medusa's shipped typings, so the patched shape is
// asserted here. Keep in sync with patches/@medusajs+core-flows@*-payment-hooks.patch.
export const capturePaymentWorkflow =
  medusaCapturePaymentWorkflow as unknown as ReturnWorkflow<
    CapturePaymentWorkflowInput,
    PaymentDTO,
    CapturePaymentWorkflowHooks
  >

export const refundPaymentWorkflow =
  medusaRefundPaymentWorkflow as unknown as ReturnWorkflow<
    RefundPaymentWorkflowInput,
    PaymentDTO,
    RefundPaymentWorkflowHooks
  >
