import { defineLink } from "@medusajs/framework/utils"
import PromotionModule from "@medusajs/medusa/promotion"
import SellerModule from "../modules/seller"

export default defineLink({ linkable: PromotionModule.linkable.campaign, isList: true }, SellerModule.linkable.seller)
