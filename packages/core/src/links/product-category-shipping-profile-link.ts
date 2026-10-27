import { defineLink } from "@medusajs/framework/utils"
import FulfillmentModule from "@medusajs/medusa/fulfillment"
import ProductModule from "@medusajs/medusa/product"

// `shipping_profile` is already registered on the product module service by
// the native product link; reusing it here would shadow that alias.
export default defineLink(
  {
    linkable: ProductModule.linkable.productCategory,
    isList: true,
  },
  {
    linkable: FulfillmentModule.linkable.shippingProfile,
    alias: "default_shipping_profile",
  }
)
