import { defineJoinerConfig } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import SearchProduct from "./models/search-product"
import SearchProductPrice from "./models/search-product-price"

export const joinerConfig = defineJoinerConfig(MercurModules.SEARCH, {
  linkableKeys: {
    search_product_id: SearchProduct.name,
    search_product_price_id: SearchProductPrice.name,
  },
})
