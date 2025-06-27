import { MedusaService } from '@medusajs/framework/utils'

import { Brand } from './models/brand'

class BrandModuleService extends MedusaService({
  Brand
}) {}

export default BrandModuleService
