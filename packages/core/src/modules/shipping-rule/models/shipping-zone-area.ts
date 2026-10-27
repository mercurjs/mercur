import { model } from "@medusajs/framework/utils"

import ShippingZone from "./shipping-zone"

const ShippingZoneArea = model.define("ShippingZoneArea", {
  id: model.id({ prefix: "shzarea" }).primaryKey(),
  type: model.enum(["country", "province"]).default("country"),
  country_code: model.text(),
  province_code: model.text().nullable(),
  shipping_zone: model.belongsTo(() => ShippingZone, {
    mappedBy: "geo_zones",
  }),
})

export default ShippingZoneArea
