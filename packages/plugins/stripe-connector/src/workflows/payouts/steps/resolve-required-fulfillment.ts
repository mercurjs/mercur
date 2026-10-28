import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { resolveConnector } from "../../../utils/payout-module"

export const resolveRequiredFulfillmentStepId = "resolve-stripe-required-fulfillment"

export const resolveRequiredFulfillmentStep = createStep(
  resolveRequiredFulfillmentStepId,
  async (_, { container }) =>
    new StepResponse(resolveConnector(container).getOptions().transfers.requiredFulfillmentStatus)
)
