import { defineLink } from "@medusajs/framework/utils"

import MemberModule from "../modules/member"
import SellerModule from "@mercurjs/core-plugin/modules/seller"

export default defineLink(SellerModule.linkable.seller, {
  linkable: MemberModule.linkable.member,
  isList: true,
})
