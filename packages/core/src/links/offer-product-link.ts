import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import OfferModule from "../modules/offer"

export default defineLink(
  {
    linkable: OfferModule.linkable.offer,
    isList: true,
  },
  ProductModule.linkable.product,
  {
    database: {
      table: "offer_product",
    },
  }
)
