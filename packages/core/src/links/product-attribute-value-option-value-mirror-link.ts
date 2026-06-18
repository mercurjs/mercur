import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"

import ProductAttributeModule from "../modules/product-attribute"

/**
 * ProductAttributeValue → ProductOptionValue mirror (1:1).
 *
 * SPEC-014 companion to {@link product-attribute-option-mirror-link}: each
 * value of a variant-axis attribute mirrors one native option value. Lets the
 * wrappers map selected attribute `value_ids` onto the option's value subset
 * (`attribute_value.mirror_option_value.id`).
 *
 * `mirror_*` aliases avoid shadowing the product module's own
 * `product_option_value` relation.
 */
export default defineLink(
  {
    linkable: {
      ...ProductAttributeModule.linkable.productAttributeValue.id,
      alias: "mirror_source_attribute_value",
    },
    isList: false,
  },
  {
    linkable: {
      ...ProductModule.linkable.productOptionValue.id,
      alias: "mirror_option_value",
    },
    isList: false,
  },
  {
    database: {
      table: "product_attribute_value_option_value_mirror",
    },
  },
)
