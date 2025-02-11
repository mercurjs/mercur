import { MedusaService } from '@medusajs/framework/utils'

import { DefaultSellerShippingOption } from './models/default-seller-shipping-option'
import { DefaultShippingOption } from './models/default-shipping-option'

class DefaultShippingOptionModuleService extends MedusaService({
  DefaultShippingOption,
  DefaultSellerShippingOption
}) {}

export default DefaultShippingOptionModuleService
