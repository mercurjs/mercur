import { Modules } from '@medusajs/framework/utils'
import { ModuleProvider } from '@medusajs/utils'

import StripeTaxProvider from './service'

export default ModuleProvider(Modules.TAX, {
  services: [StripeTaxProvider]
})
