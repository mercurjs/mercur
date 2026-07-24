import { MedusaService } from "@medusajs/framework/utils"
import { UpsertPromotionCostDTO } from "@mercurjs/types"

import { PromotionCost } from "./models"

class PromotionCostModuleService extends MedusaService({
  PromotionCost,
}) {
  async upsertPromotionCostsByPromotionId(
    input: UpsertPromotionCostDTO | UpsertPromotionCostDTO[]
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

    const toCreate: UpsertPromotionCostDTO[] = []
    const toUpdate: (UpsertPromotionCostDTO & { id: string })[] = []

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
