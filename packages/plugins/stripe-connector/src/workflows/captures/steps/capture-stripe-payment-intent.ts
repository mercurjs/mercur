import { BigNumberInput } from "@medusajs/framework/types"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { resolveConnector } from "../../../utils/payout-module"

export type CaptureStripePaymentIntentStepInput = {
  capture_id: string
  payment_intent_id: string
  currency_code: string
  capturable_amount: BigNumberInput
}

export const captureStripePaymentIntentStepId = "capture-stripe-payment-intent"

/**
 * Captures only the decided part of the cart payment at Stripe; Medusa's
 * provider then finds the intent captured and records it as it is.
 */
export const captureStripePaymentIntentStep = createStep(
  captureStripePaymentIntentStepId,
  async (input: CaptureStripePaymentIntentStepInput, { container }) => {
    await resolveConnector(container).capturePaymentIntent(
      input.capture_id,
      input.payment_intent_id,
      input.capturable_amount,
      input.currency_code
    )
    return new StepResponse(void 0)
  }
  // No compensation: captured funds have been taken from the customer.
)
