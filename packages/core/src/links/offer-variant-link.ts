import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "../modules/product"
import OfferModule from "../modules/offer"

export default defineLink(
  {
    linkable: OfferModule.linkable.offer,
    field: "variant_id",
  },
  ProductModule.linkable.productVariant,
  {
    readOnly: true,
  }
)
