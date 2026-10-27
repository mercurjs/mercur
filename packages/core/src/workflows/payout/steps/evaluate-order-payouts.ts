import { FulfillmentStatus } from "@medusajs/framework/types"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { upsertOrderPayouts, upsertPayoutReversals } from "../utils/order-payouts"

export const evaluateOrderPayoutsStepId = "evaluate-order-payouts"

export const evaluateOrderPayoutsStep = createStep(
  evaluateOrderPayoutsStepId,
  async (
    input: { order_ids: string[]; required_fulfillment_status: FulfillmentStatus },
    { container }
  ) => {
    return new StepResponse(
      await upsertOrderPayouts(container, input.order_ids, input.required_fulfillment_status)
    )
  }
)

export const evaluatePayoutReversalsStepId = "evaluate-payout-reversals"

export const evaluatePayoutReversalsStep = createStep(
  evaluatePayoutReversalsStepId,
  async (input: { order_ids: string[] }, { container }) => {
    return new StepResponse(await upsertPayoutReversals(container, input.order_ids))
  }
)
