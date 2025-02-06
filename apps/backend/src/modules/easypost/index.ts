import { ModuleProvider, Modules } from '@medusajs/framework/utils'

import EasyPostProviderService from './service'

export default ModuleProvider(Modules.FULFILLMENT, {
  services: [EasyPostProviderService]
})
