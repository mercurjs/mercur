import { defineJoinerConfig } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import ProductAttribute from "./models/product-attribute"
import ProductAttributeValue from "./models/product-attribute-value"

export const joinerConfig = defineJoinerConfig(MercurModules.PRODUCT_ATTRIBUTE, {
  linkableKeys: {
    product_attribute_id: ProductAttribute.name,
    product_attribute_value_id: ProductAttributeValue.name,
  },
})
