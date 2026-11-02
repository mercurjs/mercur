import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { AdjustmentDTO, AdjustmentType } from "../../../types/common"
import { resolveConnector } from "../../../utils/payout-module"

export type CreateAdjustmentsStepInput = {
  account_id: string
  type: AdjustmentType
  amount: number
  currency_code: string
  reason: string | null
  created_by: string | null
}[]

export const createAdjustmentsStepId = "create-stripe-adjustments"

export const createAdjustmentsStep = createStep(
  createAdjustmentsStepId,
  async (input: CreateAdjustmentsStepInput, { container }) => {
    const adjustments = await resolveConnector(container).createAdjustments(input)
    return new StepResponse<AdjustmentDTO[], string[]>(
      adjustments,
      adjustments.map((adjustment) => adjustment.id)
    )
  },
  async (ids, { container }) => {
    if (!ids?.length) {
      return
    }
    await resolveConnector(container).deleteAdjustments(ids)
  }
)
