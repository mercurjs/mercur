import { z } from "zod"

export const AdminUpsertPromotionCost = z.object({
  cost_bearer: z.enum(["store", "marketplace", "shared"]),
  shared_marketplace_percentage: z.number().min(0).max(100).nullish(),
})

export type AdminUpsertPromotionCostType = z.infer<
  typeof AdminUpsertPromotionCost
>
