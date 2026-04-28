import { model } from "@medusajs/framework/utils";
import ProductImage from "./product-image";
import ProductVariant from "./product-variant";

const ProductVariantProductImage = model.define(
  "ProductVariantProductImage",
  {
    id: model.id({ prefix: "pvpi" }).primaryKey(),
    variant: model.belongsTo(() => ProductVariant, {
      mappedBy: "images",
    }),
    image: model.belongsTo(() => ProductImage, {
      mappedBy: "variants",
    }),
  }
);

export default ProductVariantProductImage;
