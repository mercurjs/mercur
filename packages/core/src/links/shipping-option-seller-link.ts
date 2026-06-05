import { defineLink } from "@medusajs/framework/utils"
import FulfillmentModule from "@medusajs/medusa/fulfillment"
import SellerModule from "../modules/seller"

export default defineLink({ linkable: FulfillmentModule.linkable.shippingOption, isList: true }, SellerModule.linkable.seller)
