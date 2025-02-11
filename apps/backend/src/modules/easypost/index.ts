import { ModuleProvider, Modules } from '@medusajs/framework/utils'

import easyPostClientLoader from './loaders/client'
import EasyPostFulfillmentProviderService from './service'

export default ModuleProvider(Modules.FULFILLMENT, {
  services: [EasyPostFulfillmentProviderService],
  loaders: [easyPostClientLoader]
})
