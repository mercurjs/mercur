import { Module } from "@medusajs/framework/utils";

import SplitOrderPaymentModuleService from "./service";

export const SPLIT_ORDER_PAYMENT_MODULE = "split_order_payment";
export { SplitOrderPaymentModuleService };

export default Module(SPLIT_ORDER_PAYMENT_MODULE, {
  service: SplitOrderPaymentModuleService,
});
