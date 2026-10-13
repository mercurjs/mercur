import type { ModuleJoinerConfig } from "@medusajs/framework/types"
import { MedusaService } from "@medusajs/framework/utils"

import { joinerConfig } from "./joiner-config"
import { ReturnRequest } from "./models"

class ReturnRequestModuleService extends MedusaService({
  ReturnRequest,
}) {
  __joinerConfig(): ModuleJoinerConfig {
    return joinerConfig
  }
}

export default ReturnRequestModuleService
