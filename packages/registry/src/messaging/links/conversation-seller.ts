import { defineLink } from "@medusajs/framework/utils"

import SellerModule from "@mercurjs/core-plugin/modules/seller"
import MessagingModule from "../modules/messaging"

export default defineLink(SellerModule.linkable.seller, {
  linkable: MessagingModule.linkable.conversation,
  isList: true,
})
