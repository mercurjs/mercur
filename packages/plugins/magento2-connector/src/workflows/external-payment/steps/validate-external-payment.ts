import { MedusaError } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { EXTERNAL_PAYMENT_PROVIDER_ID } from "../../../types"

export type ValidateExternalPaymentStepInput = {
  order_id: string
  payments: { id: string; provider_id: string; captured_at: Date | string | null }[]
}

export const validateExternalPaymentStepId = "validate-external-payment"
export const validateExternalPaymentStep = createStep(
  validateExternalPaymentStepId,
  async (input: ValidateExternalPaymentStepInput) => {
    const payment = input.payments.find(
      (p) => p.provider_id === EXTERNAL_PAYMENT_PROVIDER_ID && !!p.captured_at
    )

    if (!payment) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Order with id "${input.order_id}" has no captured payment on the external provider`
      )
    }

    return new StepResponse(payment.id)
  }
)
