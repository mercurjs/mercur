import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";

import ProductVariantImage from "../modules/product-variant-image";

export default defineLink(
  {
    linkable: ProductModule.linkable.productVariant,
    isList: false,
  },
  {
    linkable: ProductVariantImage.linkable.productVariantImage,
    isList: true,
  },
  {
    database: {
      table: "product_variant_image_image",
    },
  }
);
