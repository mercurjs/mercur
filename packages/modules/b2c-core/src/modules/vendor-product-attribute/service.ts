import { MedusaService } from "@medusajs/framework/utils";

import VendorProductAttribute from "./models/vendor-product-attribute";

class VendorProductAttributeModuleService extends MedusaService({
  VendorProductAttribute,
}) {}

export default VendorProductAttributeModuleService;
