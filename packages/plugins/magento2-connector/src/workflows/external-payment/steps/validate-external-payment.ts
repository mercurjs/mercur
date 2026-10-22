import { MedusaError } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { EXTERNAL_PAYMENT_PROVIDER_ID } from "../../../types"

type PaymentRow = { id: string; provider_id: string; captured_at: Date | string | null }

export type ValidateExternalPaymentStepInput = {
  order_id: string
  payments: (PaymentRow | null)[]
  cart_payments?: (PaymentRow | null)[]
}

const isExternal = (p: PaymentRow | null): p is PaymentRow =>
  !!p && p.provider_id === EXTERNAL_PAYMENT_PROVIDER_ID

export const validateExternalPaymentStepId = "validate-external-payment"
export const validateExternalPaymentStep = createStep(
  validateExternalPaymentStepId,
  async (input: ValidateExternalPaymentStepInput) => {
    // An order only holds its own external payment once the cart payment is
    // captured and split; before that the cart's shared one is all there is.
    const payment = input.payments.filter(isExternal).find((p) => !!p.captured_at)

    if (!payment) {
      const pending = (input.cart_payments ?? []).some(isExternal) ||
        input.payments.some(isExternal)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        pending
          ? `Order with id "${input.order_id}" has an external payment that is not yet captured; capture the order group payment first`
          : `Order with id "${input.order_id}" has no payment on the external provider`
      )
    }

    return new StepResponse(payment.id)
  }
)
