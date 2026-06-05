import { defineLink } from "@medusajs/framework/utils"

import AttributeModule from "../modules/attribute"
import SellerModule from "../modules/seller"

export default defineLink(SellerModule.linkable.seller, {
  linkable: AttributeModule.linkable.attribute,
  isList: true,
})
