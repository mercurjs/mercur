import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"

import ProductAttributeModule from "../modules/product-attribute"

/**
 * ProductCategory ↔ ProductAttribute pivot link.
 *
 * `defineLink` derives the on-service field-alias from
 * `pluralize(aliasB)`. Without an explicit alias, the linkable's
 * intrinsic field (`productAttribute`) pluralises to
 * `product_attributes` on the category side and the link-service
 * composition collides with the productAttribute service's
 * auto-registered aliases. We rename both sides so that:
 *   - `productCategory.categories` is NOT the property added here
 *     (irrelevant for category service);
 *   - `productAttribute.categories` IS the property added (queried by
 *     `/vendor/product-attributes` `*categories` field).
 */
export default defineLink(
  {
    linkable: {
      ...ProductModule.linkable.productCategory.id,
      alias: "category",
    },
    isList: true,
  },
  {
    linkable: {
      ...ProductAttributeModule.linkable.productAttribute.id,
      alias: "owning_attribute",
    },
    isList: true,
  },
  {
    database: {
      table: "product_category_attribute",
    },
  }
)
