import { model } from "@medusajs/framework/utils"
import { AttributeType } from "@mercurjs/types"

import ProductAttributeValue from "./product-attribute-value"

const ProductAttribute = model
  .define("ProductAttribute", {
    id: model.id({ prefix: "pattr" }).primaryKey(),
    handle: model.text().nullable(),
    name: model.text().searchable(),
    description: model.text().nullable(),
    type: model.enum(AttributeType),
    is_required: model.boolean().default(false),
    is_filterable: model.boolean().default(false),
    is_variant_axis: model.boolean().default(false),
    rank: model.number().default(0),
    is_active: model.boolean().default(true),
    created_by: model.text().nullable(),
    metadata: model.json().nullable(),

    values: model.hasMany(() => ProductAttributeValue, {
      mappedBy: "attribute",
    }),
  })
  .cascades({ delete: ["values"] })
  .indexes([
    {
      name: "IDX_product_attribute_handle_unique",
      on: ["handle"],
      unique: true,
      where: "deleted_at IS NULL AND handle IS NOT NULL",
    },
    {
      name: "IDX_product_attribute_type",
      on: ["type"],
      unique: false,
      where: "deleted_at IS NULL",
    },
  ])

export default ProductAttribute
