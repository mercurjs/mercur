import { model } from "@medusajs/framework/utils";
import Product from "./product";
import ProductAttribute from "./product-attribute";
import ProductVariant from "./product-variant";

const ProductAttributeValue = model
  .define("ProductAttributeValue", {
    id: model.id({ prefix: "pattrval" }).primaryKey(),
    handle: model.text().nullable(),
    name: model.text(),
    rank: model.number().default(0),
    is_active: model.boolean().default(true),
    metadata: model.json().nullable(),

    // Relations
    attribute: model.belongsTo(() => ProductAttribute, {
      mappedBy: "values",
    }),
    variants: model.manyToMany(() => ProductVariant, {
      mappedBy: "attribute_values",
    }),
    products: model.manyToMany(() => Product, {
      mappedBy: "attribute_values",
    }),
  })
  .indexes([
    {
      name: "IDX_product_attribute_value_handle_unique",
      on: ["attribute_id", "handle"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ]);

export default ProductAttributeValue;
