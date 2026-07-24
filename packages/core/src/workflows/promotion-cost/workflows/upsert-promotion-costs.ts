import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { UpsertPromotionCostDTO } from "@mercurjs/types"

import { upsertPromotionCostsStep } from "../steps"

export const upsertPromotionCostsWorkflow = createWorkflow(
  "upsert-promotion-costs",
  function (input: UpsertPromotionCostDTO | UpsertPromotionCostDTO[]) {
    const costs = upsertPromotionCostsStep(input)

    return new WorkflowResponse(costs)
  }
)
