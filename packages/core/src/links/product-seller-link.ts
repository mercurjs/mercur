import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import SellerModule from "../modules/seller"

export default defineLink(ProductModule.linkable.product, SellerModule.linkable.seller)
