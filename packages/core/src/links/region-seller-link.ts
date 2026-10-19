import { defineLink } from "@medusajs/framework/utils"
import RegionModule from "@medusajs/medusa/region"
import SellerModule from "../modules/seller"

export default defineLink(
  {
    linkable: RegionModule.linkable.region,
    isList: true,
  },
  {
    linkable: SellerModule.linkable.seller,
    isList: true,
  },
  {
    database: {
      table: "region_seller",
    },
  }
)
