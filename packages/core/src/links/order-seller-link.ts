import { defineLink } from "@medusajs/framework/utils"
import OrderModule from "@medusajs/medusa/order"
import SellerModule from "../modules/seller"

export default defineLink(OrderModule.linkable.order, SellerModule.linkable.seller)
