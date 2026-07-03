import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"

import ProductAttributeModule from "../modules/product-attribute"

/**
 * Read-only link ProductAttribute → ProductOption mirror (1:1).
 * `ProductAttribute.product_option_id` is the FK; no pivot table.
 */
export default defineLink(
  {
    ...ProductAttributeModule.linkable.productAttribute.id,
    primaryKey: "product_option_id",
    isList: false,
  },
  {
    linkable: ProductModule.linkable.productOption.id,
    field: "id",
    isList: false,
  },
  {
    readOnly: true,
  },
)
