import { MedusaError } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { ExternalCartPayment } from "./resolve-external-cart-payment"

export type ValidateExternalPaymentCancelableStepInput = {
  order_group_id: string
  payment: ExternalCartPayment
}

export const validateExternalPaymentCancelableStepId =
  "validate-external-payment-cancelable"
export const validateExternalPaymentCancelableStep = createStep(
  validateExternalPaymentCancelableStepId,
  async (input: ValidateExternalPaymentCancelableStepInput) => {
    if (input.payment.captured) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Payment of order group "${input.order_group_id}" is already captured; record a refund instead`
      )
    }

    return new StepResponse(void 0)
  }
)
