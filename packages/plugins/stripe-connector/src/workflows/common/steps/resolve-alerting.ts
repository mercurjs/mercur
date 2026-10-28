import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { resolveConnector } from "../../../utils/payout-module"

export const resolveAlertingStepId = "resolve-stripe-alerting"

export const resolveAlertingStep = createStep(resolveAlertingStepId, async (_, { container }) => {
  const { alerting } = resolveConnector(container).getOptions()
  return new StepResponse({ email: alerting.technicalEmail ?? null, from: alerting.from ?? null })
})
