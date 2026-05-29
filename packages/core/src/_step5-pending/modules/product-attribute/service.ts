import type { ModuleJoinerConfig } from "@medusajs/framework/types"
import { MedusaService } from "@medusajs/framework/utils"

import { joinerConfig } from "./joiner-config"
import { ProductAttribute, ProductAttributeValue } from "./models"

class ProductAttributeModuleService extends MedusaService({
  ProductAttribute,
  ProductAttributeValue,
}) {
  __joinerConfig(): ModuleJoinerConfig {
    return joinerConfig
  }
}

export default ProductAttributeModuleService
