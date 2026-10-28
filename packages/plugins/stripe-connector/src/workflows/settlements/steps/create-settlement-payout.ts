import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { resolveConnector } from "../../../utils/payout-module"

export const createSettlementPayoutStepId = "create-stripe-settlement-payout"

export const createSettlementPayoutStep = createStep(
  createSettlementPayoutStepId,
  async (input: { settlement_id: string; stripe_account_id: string }, { container }) => {
    const settlement = await resolveConnector(container).createSettlementPayout(
      input.settlement_id,
      input.stripe_account_id
    )
    // A bank payout Stripe accepted cannot be pulled back, so there is no compensation.
    return new StepResponse(settlement)
  }
)
