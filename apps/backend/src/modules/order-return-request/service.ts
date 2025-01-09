import { MedusaService } from '@medusajs/framework/utils'

import { OrderReturnRequest } from './models/return-request'

class OrderReturnModuleService extends MedusaService({
  OrderReturnRequest
}) {}

export default OrderReturnModuleService
