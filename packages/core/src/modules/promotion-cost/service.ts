import { MedusaService } from "@medusajs/framework/utils"

import { PromotionCost } from "./models"

class PromotionCostModuleService extends MedusaService({
  PromotionCost,
}) {}

export default PromotionCostModuleService
