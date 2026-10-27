import { model } from "@medusajs/framework/utils"

import ShippingRule from "./shipping-rule"
import ShippingZoneArea from "./shipping-zone-area"

const ShippingZone = model
  .define("ShippingZone", {
    id: model.id({ prefix: "shzone" }).primaryKey(),
    name: model.text(),
    code: model.text(),
    is_active: model.boolean().default(true),
    metadata: model.json().nullable(),
    geo_zones: model.hasMany(() => ShippingZoneArea, {
      mappedBy: "shipping_zone",
    }),
    rules: model.hasMany(() => ShippingRule, {
      mappedBy: "shipping_zone",
    }),
  })
  .cascades({
    delete: ["geo_zones", "rules"],
  })
  .indexes([
    {
      name: "IDX_shipping_zone_code_unique",
      on: ["code"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])

export default ShippingZone
