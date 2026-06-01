import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"

import ProductAttributeModule from "../modules/product-attribute"

/**
 * Read-only link Product → ProductAttribute (product-scoped attributes).
 * `ProductAttribute.product_id` is the FK; global attributes have it NULL.
 * Exposes the scoped attributes under `product.scoped_attributes`.
 *
 * Same pattern as `product-change-link.ts`: no pivot table — the FK lives
 * directly on the child row, and the link is read-only.
 */
export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    field: "id",
    isList: true,
  },
  {
    ...ProductAttributeModule.linkable.productAttribute.id,
    alias: "scoped_attributes",
    primaryKey: "product_id",
    isList: true,
  },
  {
    readOnly: true,
  },
)
