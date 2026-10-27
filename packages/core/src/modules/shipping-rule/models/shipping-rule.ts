import { model } from "@medusajs/framework/utils"

import MarketplaceShippingMethod from "./shipping-method"
import ShippingRulePrice from "./shipping-rule-price"
import ShippingZone from "./shipping-zone"

const ShippingRule = model
  .define("ShippingRule", {
    id: model.id({ prefix: "shrule" }).primaryKey(),
    shipping_profile_id: model.text(),
    requirement: model
      .enum(["mandatory", "optional", "not_supported"])
      .default("optional"),
    price_type: model.enum(["flat", "calculated"]).default("flat"),
    seller_can_edit_price: model.boolean().default(false),
    transit_min_days: model.number().nullable(),
    transit_max_days: model.number().nullable(),
    seller_can_edit_transit: model.boolean().default(false),
    shipping_zone: model.belongsTo(() => ShippingZone, {
      mappedBy: "rules",
    }),
    shipping_method: model.belongsTo(() => MarketplaceShippingMethod, {
      mappedBy: "rules",
    }),
    prices: model.hasMany(() => ShippingRulePrice, {
      mappedBy: "shipping_rule",
    }),
  })
  .cascades({
    delete: ["prices"],
  })
  .indexes([
    {
      name: "IDX_shipping_rule_zone_method_profile_unique",
      on: ["shipping_zone_id", "shipping_method_id", "shipping_profile_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_shipping_rule_shipping_profile_id",
      on: ["shipping_profile_id"],
      where: "deleted_at IS NULL",
    },
  ])

export default ShippingRule
