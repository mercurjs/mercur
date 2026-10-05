import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import {
  loadSplitOrderPaymentContext,
  SplitOrderPaymentContextInput,
} from "../utils"

export const getSplitOrderPaymentContextStepId =
  "get-split-order-payment-context"

export const getSplitOrderPaymentContextStep = createStep(
  getSplitOrderPaymentContextStepId,
  async (input: SplitOrderPaymentContextInput, { container }) => {
    return new StepResponse(
      await loadSplitOrderPaymentContext(container, input)
    )
  }
)
