import { ModuleProvider, Modules } from '@medusajs/framework/utils'

import AdyenConnectCardProviderService from './services/adyen-connect-card-provider'

export default ModuleProvider(Modules.PAYMENT, {
  services: [AdyenConnectCardProviderService]
})
