import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { PayoutStatus } from "@mercurjs/types"

import { SettlementStatus } from "../../../types/common"
import { resolveConnector } from "../../../utils/payout-module"
import { CreatedSettlement } from "./create-settlements"

export const dispatchSettlementPayoutsStepId = "dispatch-stripe-settlement-payouts"

/** Sends the bank payout of each new settlement that is open and ready to go. */
export const dispatchSettlementPayoutsStep = createStep(
  dispatchSettlementPayoutsStepId,
  async (input: { settlements: CreatedSettlement[] }, { container }) => {
    const connector = resolveConnector(container)
    const ready = input.settlements.filter(
      (settlement) =>
        settlement.status === SettlementStatus.OPEN &&
        settlement.payout_status === PayoutStatus.PENDING &&
        !!settlement.external_id
    )
    for (const settlement of ready) {
      await connector.dispatchSettlementPayout(settlement.id, settlement.external_id as string)
    }
    return new StepResponse(ready.length)
  }
)
