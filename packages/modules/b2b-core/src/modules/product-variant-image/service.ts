import { MedusaService } from "@medusajs/framework/utils";

import { ProductVariantImage } from "./models/product-variant-image";

class ProductVariantImageModuleService extends MedusaService({
  ProductVariantImage,
}) {}

export default ProductVariantImageModuleService;
