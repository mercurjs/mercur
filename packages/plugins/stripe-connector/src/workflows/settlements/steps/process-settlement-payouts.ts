import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { PayoutStatus } from "@mercurjs/types"

import { SettlementStatus } from "../../../types/common"
import { resolveConnector } from "../../../utils/payout-module"
import { CreatedSettlement } from "./create-settlements"

export const processSettlementPayoutsStepId = "process-stripe-settlement-payouts"

export const processSettlementPayoutsStep = createStep(
  processSettlementPayoutsStepId,
  async (input: { settlements: CreatedSettlement[] }, { container }) => {
    const connector = resolveConnector(container)
    const ready = input.settlements.filter(
      (settlement) =>
        settlement.status === SettlementStatus.OPEN &&
        settlement.payout_status === PayoutStatus.PENDING &&
        !!settlement.external_id
    )
    for (const settlement of ready) {
      await connector.createSettlementPayout(settlement.id, settlement.external_id as string)
    }
    // A bank payout Stripe accepted cannot be pulled back, so there is no compensation.
    return new StepResponse(ready.length)
  }
)
