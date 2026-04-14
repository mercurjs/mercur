import { defineLink } from "@medusajs/framework/utils"
import OrderModule from "@medusajs/medusa/order"
import SellerModule from "../modules/seller"

export default defineLink({ linkable: OrderModule.linkable.order, isList: true }, SellerModule.linkable.seller)
