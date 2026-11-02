import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { resolveConnector } from "../../../utils/payout-module"

export const claimOperatorNotificationStepId = "claim-stripe-operator-notification"

/**
 * Retried payouts fail again on every run; the operator hears about each
 * failure once, so the key is claimed in the checkpoints before sending.
 */
export const claimOperatorNotificationStep = createStep(
  claimOperatorNotificationStepId,
  async (input: { key: string }, { container }) => {
    const connector = resolveConnector(container)
    if (await connector.getCheckpoint(input.key)) {
      return new StepResponse(false, null)
    }
    await connector.setCheckpoint(input.key, new Date().toISOString())
    return new StepResponse(true, input.key)
  },
  async (key, { container }) => {
    if (!key) {
      return
    }
    await resolveConnector(container).setCheckpoint(key, null)
  }
)
