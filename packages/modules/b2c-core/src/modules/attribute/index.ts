import { Module } from "@medusajs/framework/utils";

import AttributeModuleService from "./service";

export const ATTRIBUTE_MODULE = "attribute";
export { AttributeModuleService };

export default Module(ATTRIBUTE_MODULE, {
  service: AttributeModuleService,
});
