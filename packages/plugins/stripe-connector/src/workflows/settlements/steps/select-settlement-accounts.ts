import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export const selectSettlementAccountsStepId = "select-stripe-settlement-accounts"

/** The payout accounts of one seller, or every account when no seller is given. */
export const selectSettlementAccountsStep = createStep(
  selectSettlementAccountsStepId,
  async (input: { seller_id?: string }, { container }) => {
    if (!input.seller_id) {
      return new StepResponse<string[] | null>(null)
    }
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "seller_payout_account",
      fields: ["payout_account_id"],
      filters: { seller_id: input.seller_id },
    })
    return new StepResponse<string[] | null>(data.map((link) => link.payout_account_id))
  }
)
