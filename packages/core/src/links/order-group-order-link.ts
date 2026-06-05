import { defineLink } from "@medusajs/framework/utils"
import OrderModule from "@medusajs/medusa/order"
import SellerModule from "../modules/seller"

export default defineLink(SellerModule.linkable.orderGroup, { linkable: OrderModule.linkable.order, isList: true }, {
    database: {
        table: 'order_group_order',
    }
})
