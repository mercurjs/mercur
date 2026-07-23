import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import PromotionCostModuleService from "./service"

export default Module(MercurModules.PROMOTION_COST, {
  service: PromotionCostModuleService,
})
