import { defineLink } from "@medusajs/framework/utils"
import StockLocationModule from "@medusajs/medusa/stock-location"
import SellerModule from "../modules/seller"

export default defineLink(StockLocationModule.linkable.stockLocation, SellerModule.linkable.seller)
