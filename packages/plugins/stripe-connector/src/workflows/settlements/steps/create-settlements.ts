import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { PayoutStatus } from "@mercurjs/types"

import { SettlementStatus } from "../../../types/common"
import { resolveConnector } from "../../../utils/payout-module"
import { PlannedSettlement } from "../utils/plan-settlements"

export type CreatedSettlement = {
  id: string
  account_id: string
  external_id: string | null
  seller_id: string | null
  currency_code: string
  amount: number
  status: SettlementStatus
  payout_status: PayoutStatus | null
}

export const createSettlementsStepId = "create-stripe-settlements"

export const createSettlementsStep = createStep(
  createSettlementsStepId,
  async (input: PlannedSettlement[], { container }) => {
    const connector = resolveConnector(container)
    const settlements = await connector.createSettlementsWithLines(
      input.map(({ external_id: _external, seller_id: _seller, ...settlement }) => settlement)
    )
    const byKey = new Map(settlements.map((s) => [`${s.account_id}:${s.currency_code}`, s]))

    const created: CreatedSettlement[] = input.flatMap((planned) => {
      const settlement = byKey.get(`${planned.account_id}:${planned.currency_code}`)
      return settlement
        ? [
            {
              id: settlement.id,
              account_id: planned.account_id,
              external_id: planned.external_id,
              seller_id: planned.seller_id,
              currency_code: planned.currency_code,
              amount: planned.amount,
              status: planned.status,
              payout_status: planned.payout_status,
            },
          ]
        : []
    })

    return new StepResponse(
      created,
      created.map((settlement) => settlement.id)
    )
  },
  async (ids, { container }) => {
    if (!ids?.length) {
      return
    }
    await resolveConnector(container).deleteSettlements(ids)
  }
)
