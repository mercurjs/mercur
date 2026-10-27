import { model } from "@medusajs/framework/utils"

import ShippingRule from "./shipping-rule"

const ShippingRulePrice = model.define("ShippingRulePrice", {
  id: model.id({ prefix: "shrprice" }).primaryKey(),
  currency_code: model.text().nullable(),
  region_id: model.text().nullable(),
  amount: model.bigNumber(),
  shipping_rule: model.belongsTo(() => ShippingRule, {
    mappedBy: "prices",
  }),
})

export default ShippingRulePrice
