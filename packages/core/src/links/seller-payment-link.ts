import { defineLink } from "@medusajs/framework/utils"
import PaymentModule from "@medusajs/medusa/payment"
import SellerModule from "../modules/seller"

export default defineLink(SellerModule.linkable.seller, { linkable: PaymentModule.linkable.payment, isList: true })
