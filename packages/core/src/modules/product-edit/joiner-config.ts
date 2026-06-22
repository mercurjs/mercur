import { defineJoinerConfig } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import ProductChange from "./models/product-change"
import ProductChangeAction from "./models/product-change-action"

export const joinerConfig = defineJoinerConfig(MercurModules.PRODUCT_EDIT, {
  linkableKeys: {
    product_change_id: ProductChange.name,
    product_change_action_id: ProductChangeAction.name,
  },
})
