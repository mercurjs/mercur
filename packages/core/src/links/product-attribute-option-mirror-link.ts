import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"

import ProductAttributeModule from "../modules/product-attribute"

/**
 * ProductAttribute → ProductOption mirror (1:1).
 *
 * SPEC-014: a variant-axis attribute (`is_variant_axis = true`, only
 * `multi_select`) is backed by a native Medusa global `ProductOption`. This
 * link is the single source of truth tying the Mercur attribute to its mirror
 * option, so the product wrappers can resolve the option via `query.graph`
 * (`attribute.mirror_option.id`) instead of a bespoke resolution step.
 *
 * Aliases are deliberately `mirror_*` (not `product_option`) to avoid
 * shadowing the product module's own `product_option` relation — an alias
 * that collides with a same-module relation silently breaks graph resolution.
 */
export default defineLink(
  {
    linkable: {
      ...ProductAttributeModule.linkable.productAttribute.id,
      alias: "mirror_source_attribute",
    },
    isList: false,
  },
  {
    linkable: {
      ...ProductModule.linkable.productOption.id,
      alias: "mirror_option",
    },
    isList: false,
  },
  {
    database: {
      table: "product_attribute_option_mirror",
    },
  },
)
