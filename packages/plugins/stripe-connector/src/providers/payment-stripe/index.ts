import { ModuleProvider, Modules } from "@medusajs/framework/utils"

import { StripeConnectorPaymentProviderService } from "./service"

export { StripeConnectorPaymentProviderService }

export default ModuleProvider(Modules.PAYMENT, {
  services: [StripeConnectorPaymentProviderService],
})
