import { StepResponse } from "@medusajs/framework/workflows-sdk"
import { createPromotionsWorkflow } from "@medusajs/medusa/core-flows"
import { MercurModules } from "@mercurjs/types"

import type PromotionCostModuleService from "../../../modules/promotion-cost/service"

type CostBearer = "store" | "marketplace" | "shared"

const isCostBearer = (value: unknown): value is CostBearer =>
  value === "store" || value === "marketplace" || value === "shared"

createPromotionsWorkflow.hooks.promotionsCreated(
  async ({ promotions, additional_data }, { container }) => {
    const costBearer = additional_data?.cost_bearer

    if (!isCostBearer(costBearer)) {
      return new StepResponse([], [])
    }

    const rawPercentage = additional_data?.shared_marketplace_percentage
    const sharedMarketplacePercentage =
      costBearer === "shared" && typeof rawPercentage === "number"
        ? rawPercentage
        : null

    const service = container.resolve<PromotionCostModuleService>(
      MercurModules.PROMOTION_COST
    )

    const created = await service.createPromotionCosts(
      promotions.map((promotion) => ({
        promotion_id: promotion.id,
        cost_bearer: costBearer,
        shared_marketplace_percentage: sharedMarketplacePercentage,
      }))
    )

    return new StepResponse(
      created.map((c) => c.id),
      created.map((c) => c.id)
    )
  },
  async (costIds: string[] | undefined, { container }) => {
    if (!costIds?.length) {
      return
    }

    const service = container.resolve<PromotionCostModuleService>(
      MercurModules.PROMOTION_COST
    )
    await service.deletePromotionCosts(costIds)
  }
)
