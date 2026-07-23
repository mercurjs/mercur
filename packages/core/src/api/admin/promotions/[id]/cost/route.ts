import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { upsertPromotionCostsWorkflow } from "../../../../../workflows/promotion-cost"
import { AdminUpsertPromotionCostType } from "./validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpsertPromotionCostType>,
  res: MedusaResponse
) => {
  const { id } = req.params
  const { cost_bearer, shared_marketplace_percentage } = req.validatedBody

  const { result } = await upsertPromotionCostsWorkflow(req.scope).run({
    input: {
      promotion_id: id,
      cost_bearer,
      shared_marketplace_percentage:
        cost_bearer === "shared" ? shared_marketplace_percentage ?? null : null,
    },
  })

  const [promotion_cost] = Array.isArray(result) ? result : [result]

  res.json({ promotion_cost })
}
