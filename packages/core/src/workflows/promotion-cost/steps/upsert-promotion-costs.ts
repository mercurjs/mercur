import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules, UpsertPromotionCostDTO } from "@mercurjs/types"

import type PromotionCostModuleService from "../../../modules/promotion-cost/service"

export const upsertPromotionCostsStep = createStep(
  "upsert-promotion-costs",
  async (input: UpsertPromotionCostDTO | UpsertPromotionCostDTO[], { container }) => {
    const service = container.resolve<PromotionCostModuleService>(
      MercurModules.PROMOTION_COST
    )

    const entries = Array.isArray(input) ? input : [input]

    const existing = await service.listPromotionCosts({
      promotion_id: entries.map((entry) => entry.promotion_id),
    })

    const costs = await service.upsertPromotionCostsByPromotionId(entries)

    return new StepResponse(costs, { entries, existing })
  },
  async (compensation, { container }) => {
    if (!compensation) {
      return
    }

    const service = container.resolve<PromotionCostModuleService>(
      MercurModules.PROMOTION_COST
    )

    const { entries, existing } = compensation
    const existingPromotionIds = new Set(
      existing.map((cost) => cost.promotion_id)
    )

    if (existing.length) {
      await service.updatePromotionCosts(
        existing.map((cost) => ({
          id: cost.id,
          cost_bearer: cost.cost_bearer,
          shared_marketplace_percentage: cost.shared_marketplace_percentage,
        }))
      )
    }

    const createdPromotionIds = entries
      .map((entry) => entry.promotion_id)
      .filter((promotionId) => !existingPromotionIds.has(promotionId))

    if (createdPromotionIds.length) {
      const created = await service.listPromotionCosts({
        promotion_id: createdPromotionIds,
      })

      if (created.length) {
        await service.deletePromotionCosts(created.map((cost) => cost.id))
      }
    }
  }
)
