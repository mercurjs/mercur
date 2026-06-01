import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"

import ProductAttributeModule from "../modules/product-attribute"

/**
 * Product ↔ ProductAttributeValue pivot link.
 *
 * Why both sides set `alias` inside the `linkable` payload (not at the
 * top level of the input):
 *
 *   - `defineLink` infers the link-service name from `aliasA + "_" + aliasB`.
 *     The product-attribute service already auto-registers
 *     `product_attribute_value` as an alias, so the default composition
 *     (`product` + `product_attribute_value`) collides. We rename
 *     `aliasA` to `owning_product` to break that.
 *   - `prepareServiceConfig`'s InputSource branch (triggered when the
 *     top-level input has `serviceName`) hardcodes `isList: false`,
 *     stripping our intent. By embedding the alias inside the `linkable`
 *     object we stay on the InputOptions branch, which preserves
 *     `isList: true` and derives the property as
 *     `pluralize(alias)` — `attribute_values` on the product side
 *     (matches what `formatProductAttributes` and the `[id]/attributes`
 *     routes already query).
 */
export default defineLink(
  {
    linkable: {
      ...ProductModule.linkable.product.id,
      alias: "owning_product",
    },
    isList: true,
  },
  {
    linkable: {
      ...ProductAttributeModule.linkable.productAttributeValue.id,
      alias: "attribute_value",
    },
    isList: true,
  },
  {
    database: {
      table: "product_attribute_value_link",
    },
  }
)
