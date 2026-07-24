import { model } from "@medusajs/framework/utils"

const PromotionCost = model
  .define("PromotionCost", {
    id: model.id({ prefix: "promcost" }).primaryKey(),
    promotion_id: model.text(),
    cost_bearer: model.enum(["store", "marketplace", "shared"]).default("store"),
    shared_marketplace_percentage: model.number().nullable(),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_promotion_cost_promotion_id_unique",
      on: ["promotion_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])

export default PromotionCost
