import { model } from "@medusajs/framework/utils";
import Product from "./product";

const ProductBrand = model
  .define("ProductBrand", {
    id: model.id({ prefix: "pbrand" }).primaryKey(),
    name: model.text().searchable(),
    handle: model.text(),
    is_restricted: model.boolean().default(false),
    metadata: model.json().nullable(),
    products: model.hasMany(() => Product, {
      mappedBy: "brand",
    }),
  })
  .indexes([
    {
      name: "IDX_product_brand_name_unique",
      on: ["name"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_product_brand_handle_unique",
      on: ["handle"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ]);

export default ProductBrand;
