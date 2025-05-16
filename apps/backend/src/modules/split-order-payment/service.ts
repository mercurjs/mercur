import { MedusaService } from '@medusajs/framework/utils'

import { SplitOrderPayment } from './models/split-order-payment'

class SplitOrderPaymentModuleService extends MedusaService({
  SplitOrderPayment
}) {}

export default SplitOrderPaymentModuleService
