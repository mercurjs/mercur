import { MedusaService } from '@medusajs/framework/utils'

import { OrderSet } from './models'

class MarketplaceModuleService extends MedusaService({
  OrderSet
}) {}

export default MarketplaceModuleService
