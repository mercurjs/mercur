import { model } from "@medusajs/framework/utils"

import ProductAttributeValue from "./product-attribute-value"

const ProductVariantAttributeValue = model
  .define("ProductVariantAttributeValue", {
    id: model.id({ prefix: "pvattrval" }).primaryKey(),
    // FK to the stock `product_variant` table; the product module owns the row,
    // so no database-level constraint is declared.
    variant_id: model.text(),
    metadata: model.json().nullable(),

    value: model.belongsTo(() => ProductAttributeValue, {
      mappedBy: "variant_links",
    }),
  })
  .indexes([
    {
      name: "IDX_product_variant_attribute_value_variant_id",
      on: ["variant_id"],
      unique: false,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_product_variant_attribute_value_unique",
      on: ["variant_id", "value_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])

export default ProductVariantAttributeValue
