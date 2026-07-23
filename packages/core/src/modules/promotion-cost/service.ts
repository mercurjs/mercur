import { MedusaService } from "@medusajs/framework/utils"

import { PromotionCost } from "./models"

type CostBearer = "store" | "marketplace" | "shared"

type UpsertByPromotionIdInput = {
  promotion_id: string
  cost_bearer: CostBearer
  shared_marketplace_percentage?: number | null
  metadata?: Record<string, unknown> | null
}

class PromotionCostModuleService extends MedusaService({
  PromotionCost,
}) {
  // Native `upsertPromotionCosts` keys off the primary id. Promotion costs are
  // one-per-promotion (enforced by a unique index on `promotion_id`), so
  // callers only know the promotion id — resolve the existing row by
  // `promotion_id` and create or update accordingly.
  async upsertPromotionCostsByPromotionId(
    input: UpsertByPromotionIdInput | UpsertByPromotionIdInput[]
  ) {
    const data = Array.isArray(input) ? input : [input]

    if (!data.length) {
      return []
    }

    const existing = await this.listPromotionCosts({
      promotion_id: data.map((entry) => entry.promotion_id),
    })

    const existingByPromotion = new Map(
      existing.map((cost) => [cost.promotion_id, cost])
    )

    const toCreate: UpsertByPromotionIdInput[] = []
    const toUpdate: (UpsertByPromotionIdInput & { id: string })[] = []

    for (const entry of data) {
      const current = existingByPromotion.get(entry.promotion_id)

      if (current) {
        toUpdate.push({ ...entry, id: current.id })
      } else {
        toCreate.push(entry)
      }
    }

    const created = toCreate.length
      ? await this.createPromotionCosts(toCreate)
      : []
    const updated = toUpdate.length
      ? await this.updatePromotionCosts(toUpdate)
      : []

    return [...created, ...updated]
  }
}

export default PromotionCostModuleService
