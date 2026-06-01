import type { ModuleJoinerConfig } from "@medusajs/framework/types"
import { MedusaService } from "@medusajs/framework/utils"

import { joinerConfig } from "./joiner-config"
import { ProductChange, ProductChangeAction } from "./models"

class ProductChangeModuleService extends MedusaService({
  ProductChange,
  ProductChangeAction,
}) {
  __joinerConfig(): ModuleJoinerConfig {
    return joinerConfig
  }
}

export default ProductChangeModuleService
