import { BigNumberInput, PaymentDTO } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

/**
 * The captures to record.
 */
export type RecordPaymentCapturesStepInput = {
  /**
   * The ID of the payment the capture belongs to.
   */
  payment_id: string
  /**
   * The captured amount.
   */
  amount: BigNumberInput
}[]

type RecordPaymentCapturesCompensation = {
  capture_ids: string[]
  /**
   * Payments the step marked as captured.
   */
  captured_payment_ids: string[]
}

// Captures are rows of the payment module, written by the methods the module
// service generates for its models; they are not on `IPaymentModuleService`.
type CaptureRowService = {
  deleteCaptures(ids: string[]): Promise<void>
  updatePayments(
    data: { id: string; captured_at: Date | null }[]
  ): Promise<unknown>
}

export const recordPaymentCapturesStepId = "record-payment-captures"
/**
 * This step records captures the payment provider has already made, without
 * capturing at the provider again.
 *
 * Its compensation removes the capture records again; the provider is not
 * contacted, since the money was captured before the step ran.
 *
 * @example
 * const payments = recordPaymentCapturesStep([{
 *   payment_id: "pay_123",
 *   amount: 40
 * }])
 */
export const recordPaymentCapturesStep = createStep(
  recordPaymentCapturesStepId,
  async (input: RecordPaymentCapturesStepInput, { container }) => {
    const paymentModule = container.resolve(Modules.PAYMENT)
    const payments: PaymentDTO[] = []
    const compensation: RecordPaymentCapturesCompensation = {
      capture_ids: [],
      captured_payment_ids: [],
    }

    for (const capture of input ?? []) {
      const before = await paymentModule.retrievePayment(capture.payment_id, {
        relations: ["captures"],
      })
      const knownCaptureIds = new Set(
        (before.captures ?? []).map((existing) => existing.id)
      )

      const payment = await paymentModule.capturePayment({
        ...capture,
        is_captured: true,
      })
      payments.push(payment)

      compensation.capture_ids.push(
        ...(payment.captures ?? [])
          .map((created) => created.id)
          .filter((id) => !knownCaptureIds.has(id))
      )
      if (!before.captured_at && payment.captured_at) {
        compensation.captured_payment_ids.push(payment.id)
      }
    }

    return new StepResponse(payments, compensation)
  },
  async (compensation, { container }) => {
    if (!compensation?.capture_ids.length) {
      return
    }

    const service = container.resolve(
      Modules.PAYMENT
    ) as unknown as CaptureRowService

    await service.deleteCaptures(compensation.capture_ids)

    if (compensation.captured_payment_ids.length) {
      await service.updatePayments(
        compensation.captured_payment_ids.map((id) => ({
          id,
          captured_at: null,
        }))
      )
    }
  }
)
