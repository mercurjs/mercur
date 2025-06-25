import { ModuleProvider, Modules } from '@medusajs/framework/utils'

import StripeConnectCardProviderService from './services/stripe-connect-card-provider'

export default ModuleProvider(Modules.PAYMENT, {
  services: [StripeConnectCardProviderService]
})
