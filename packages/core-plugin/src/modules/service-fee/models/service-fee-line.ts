import { model } from "@medusajs/framework/utils"

const ServiceFeeLine = model.define("service_fee_line", {
  id: model.id({ prefix: "sfline" }).primaryKey(),
  item_id: model.text(),
  service_fee_id: model.text().nullable(),
  code: model.text(),
  rate: model.float(),
  amount: model.bigNumber(),
  description: model.text().nullable(),
})

export default ServiceFeeLine
