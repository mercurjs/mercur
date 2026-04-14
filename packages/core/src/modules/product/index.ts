import { Module, Modules } from "@medusajs/framework/utils";
import ProductModuleService from "./service";

export { ProductModuleService };

export default Module(Modules.PRODUCT, {
  service: ProductModuleService,
});
