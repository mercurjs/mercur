import { MedusaService } from "@medusajs/framework/utils";

import { SplitOrderPayment } from "./models/split-order-payment";

/**
 * @class SplitOrderPaymentModuleService
 * @description Represents the split order payment module service.
 *
 * This service provides functionality for managing split order payments.
 */
class SplitOrderPaymentModuleService extends MedusaService({
  SplitOrderPayment,
}) {}

export default SplitOrderPaymentModuleService;
