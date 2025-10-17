import { Module } from "@medusajs/framework/utils";

import OrderReturnModuleService from "./service";

export const ORDER_RETURN_MODULE = "order_return";
export { OrderReturnModuleService };

export default Module(ORDER_RETURN_MODULE, {
  service: OrderReturnModuleService,
});
