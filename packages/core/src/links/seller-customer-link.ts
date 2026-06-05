import { defineLink } from "@medusajs/framework/utils"
import CustomerModule from "@medusajs/medusa/customer"
import SellerModule from "../modules/seller"

export default defineLink({ linkable: SellerModule.linkable.seller, isList: true }, { linkable: CustomerModule.linkable.customer, isList: true })
