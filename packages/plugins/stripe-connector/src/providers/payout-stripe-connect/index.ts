import { ModuleProvider } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import { StripeConnectPayoutProviderService } from "./service"

export { StripeConnectPayoutProviderService }

export default ModuleProvider(MercurModules.PAYOUT, {
  services: [StripeConnectPayoutProviderService],
})
