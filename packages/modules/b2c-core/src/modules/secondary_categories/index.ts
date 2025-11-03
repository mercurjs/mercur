import { Module } from "@medusajs/framework/utils";
import SecondaryCategoryModuleService from "./service";

export const SECONDARY_CATEGORY_MODULE = "secondary_category";

export default Module(SECONDARY_CATEGORY_MODULE, {
  service: SecondaryCategoryModuleService,
});
