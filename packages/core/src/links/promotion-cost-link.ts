import { defineLink } from "@medusajs/framework/utils"
import PromotionModule from "@medusajs/medusa/promotion"

import PromotionCostModule from "../modules/promotion-cost"

export default defineLink(
  {
    linkable: PromotionModule.linkable.promotion,
    field: "id",
  },
  {
    ...PromotionCostModule.linkable.promotionCost.id,
    primaryKey: "promotion_id",
  },
  {
    readOnly: true,
  }
)
