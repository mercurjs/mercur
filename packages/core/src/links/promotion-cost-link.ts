import { defineLink } from "@medusajs/framework/utils"
import PromotionModule from "@medusajs/medusa/promotion"

import PromotionCostModule from "../modules/promotion-cost"

export default defineLink(
  {
    linkable: PromotionCostModule.linkable.promotionCost,
    field: "promotion_id",
  },
  PromotionModule.linkable.promotion,
  {
    readOnly: true,
  }
)
