import { model } from "@medusajs/framework/utils"

import ProductAttribute from "./product-attribute"

const ProductAttributeValue = model
  .define("ProductAttributeValue", {
    id: model.id({ prefix: "pattrval" }).primaryKey(),
    handle: model.text().nullable(),
    name: model.text(),
    rank: model.number().default(0),
    is_active: model.boolean().default(true),
    metadata: model.json().nullable(),

    attribute: model.belongsTo(() => ProductAttribute, {
      mappedBy: "values",
    }),
  })
  .indexes([
    {
      name: "IDX_product_attribute_value_handle_unique",
      on: ["attribute_id", "handle"],
      unique: true,
      where: "deleted_at IS NULL AND handle IS NOT NULL",
    },
  ])

export default ProductAttributeValue
