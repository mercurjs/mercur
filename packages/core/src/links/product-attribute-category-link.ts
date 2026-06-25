import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"

import ProductAttributeModule from "../modules/product-attribute"

/**
 * ProductAttribute → ProductCategory pivot link.
 *
 * Direction: the ProductAttribute is the owner — an attribute declares which
 * categories it applies to. Surfaced on the attribute as the `categories`
 * relation (explicit alias). The pivot table keeps both FK columns
 * (`product_attribute_id`, `product_category_id`), so the direction flip is a
 * pure relabel — no schema/migration change.
 */
export default defineLink(
  {
    linkable: ProductAttributeModule.linkable.productAttribute.id,
    isList: true,
  },
  {
    ...ProductModule.linkable.productCategory.id,
    alias: "categories",
    isList: true,
  },
  {
    database: {
      table: "product_category_attribute",
    },
  }
)
