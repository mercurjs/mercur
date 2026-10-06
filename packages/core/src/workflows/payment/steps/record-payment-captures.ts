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

export const recordPaymentCapturesStepId = "record-payment-captures"
/**
 * This step records captures the payment provider has already made, without
 * capturing at the provider again.
 *
 * It is not compensated, like Medusa's `capturePaymentStep`: the money was
 * captured before the step ran.
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

    for (const capture of input ?? []) {
      payments.push(
        await paymentModule.capturePayment({ ...capture, is_captured: true })
      )
    }

    return new StepResponse(payments)
  }
)
