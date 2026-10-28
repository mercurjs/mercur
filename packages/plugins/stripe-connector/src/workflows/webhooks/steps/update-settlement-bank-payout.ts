import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import Stripe from "stripe"

import { SettlementDTO } from "../../../types/common"
import { resolveConnector } from "../../../utils/payout-module"

export type UpdateSettlementBankPayoutStepInput = {
  provider_payout_id: string
  status: Stripe.Payout["status"]
  status_reason: string | null
}

type Previous = Pick<SettlementDTO, "id" | "status" | "payout_status" | "status_reason">

export const updateSettlementBankPayoutStepId = "update-stripe-settlement-bank-payout"

export const updateSettlementBankPayoutStep = createStep(
  updateSettlementBankPayoutStepId,
  async (input: UpdateSettlementBankPayoutStepInput, { container }) => {
    const connector = resolveConnector(container)
    const [previous] = await connector.listSettlements(
      { provider_payout_id: input.provider_payout_id },
      { select: ["id", "status", "payout_status", "status_reason"] }
    )
    if (!previous) {
      return new StepResponse<SettlementDTO | null, Previous | null>(null, null)
    }

    const updated = await connector.applySettlementPayoutEvent(input.provider_payout_id, input.status, input.status_reason)
    return new StepResponse<SettlementDTO | null, Previous | null>(updated, {
      id: previous.id,
      status: previous.status,
      payout_status: previous.payout_status,
      status_reason: previous.status_reason,
    })
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }
    await resolveConnector(container).updateSettlements(previous)
  }
)
