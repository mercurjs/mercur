import { ModuleProvider, Modules } from "@medusajs/framework/utils"

import { SplitOrderPaymentProviderService } from "./service"

export * from "./constants"
export * from "./service"

export default ModuleProvider(Modules.PAYMENT, {
  services: [SplitOrderPaymentProviderService],
})
