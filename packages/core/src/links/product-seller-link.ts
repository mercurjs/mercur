import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import SellerModule from "../modules/seller"

export default defineLink({ linkable: ProductModule.linkable.product, isList: true }, SellerModule.linkable.seller)
