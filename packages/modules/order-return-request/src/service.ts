import { MedusaService } from "@medusajs/framework/utils";

import { OrderReturnRequest, OrderReturnRequestLineItem } from "./models";

/**
 * @class OrderReturnModuleService
 * @description The order return module service.
 */
class OrderReturnModuleService extends MedusaService({
  OrderReturnRequest,
  OrderReturnRequestLineItem,
}) {}

export default OrderReturnModuleService;
