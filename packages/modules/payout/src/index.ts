import { Module } from "@medusajs/framework/utils";

import PayoutModuleService from "./service";

export const PAYOUT_MODULE = "payout";
export { PayoutModuleService };

export default Module(PAYOUT_MODULE, {
  service: PayoutModuleService,
});
