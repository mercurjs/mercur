import { Module } from "@medusajs/framework/utils"

import MemberModuleService from "./service"
import seedMembersForSellersLoader from "./loaders"

export const MEMBER_MODULE = "member"

export * from "./types"
export { MemberModuleService }

export default Module(MEMBER_MODULE, {
  service: MemberModuleService,
  loaders: [seedMembersForSellersLoader],
})
