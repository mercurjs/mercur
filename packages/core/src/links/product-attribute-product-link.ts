import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"

import ProductAttributeModule from "../modules/product-attribute"

/**
 * Read-only link Product → ProductAttribute (product-scoped attributes).
 */
export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    field: "id",
    isList: true,
  },
  {
    ...ProductAttributeModule.linkable.productAttribute.id,
    alias: 'scoped_attributes',
    primaryKey: "product_id",
    isList: true,
  },
  {
    readOnly: true,
  },
)
