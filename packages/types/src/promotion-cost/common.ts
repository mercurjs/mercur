export type PromotionCostBearer = "store" | "marketplace" | "shared"

export interface PromotionCostDTO {
  id: string
  promotion_id: string
  cost_bearer: PromotionCostBearer
  shared_marketplace_percentage: number | null
  metadata: Record<string, unknown> | null
}

export interface UpsertPromotionCostDTO {
  promotion_id: string
  cost_bearer: PromotionCostBearer
  shared_marketplace_percentage?: number | null
  metadata?: Record<string, unknown> | null
}
