import { Module, Modules } from "@medusajs/framework/utils";
import ProductModuleService from "./service";

export { ProductModuleService };

// Mercur-prefixed alias consumed by the `.mercur/types.d.ts` shim emitted
// by `mercur build`. The shim re-declares `ModuleImplementations.product`
// against this type so consumers see Mercur's service shape when they
// `container.resolve(Modules.PRODUCT)`. See SPEC-006.
export { ProductModuleService as MercurProductModuleService };

export default Module(Modules.PRODUCT, {
  service: ProductModuleService,
});
