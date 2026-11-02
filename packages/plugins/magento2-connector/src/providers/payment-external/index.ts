import { ModuleProvider, Modules } from "@medusajs/framework/utils"

import ExternalPaymentProviderService from "./service"

export { ExternalPaymentProviderService }

export default ModuleProvider(Modules.PAYMENT, {
  services: [ExternalPaymentProviderService],
})
