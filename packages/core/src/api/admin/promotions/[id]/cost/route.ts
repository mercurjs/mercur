import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MercurModules } from "@mercurjs/types"

import type PromotionCostModuleService from "../../../../../modules/promotion-cost/service"
import { AdminUpsertPromotionCostType } from "./validators"

// Coverage (who bears the promotion's discount cost) is owned by the
// `promotion-cost` module, not Medusa's promotion. This endpoint upserts the
// one-per-promotion cost record so admin create/edit flows can set it without
// piggybacking on promotion `additional_data` workflow hooks.
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpsertPromotionCostType>,
  res: MedusaResponse
) => {
  const { id } = req.params
  const { cost_bearer, shared_marketplace_percentage } = req.validatedBody

  const service = req.scope.resolve<PromotionCostModuleService>(
    MercurModules.PROMOTION_COST
  )

  const [promotion_cost] = await service.upsertPromotionCostsByPromotionId({
    promotion_id: id,
    cost_bearer,
    shared_marketplace_percentage:
      cost_bearer === "shared" ? shared_marketplace_percentage ?? null : null,
  })

  res.json({ promotion_cost })
}
