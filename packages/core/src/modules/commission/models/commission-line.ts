import { model } from "@medusajs/framework/utils"

const CommissionLine = model.define("commission_line", {
  id: model.id({ prefix: "comline" }).primaryKey(),
  item_id: model.text().nullable(),
  shipping_method_id: model.text().nullable(),
  commission_rate_id: model.text().nullable(),
  provider_id: model.text().default("system"),
  code: model.text(),
  rate: model.float(),
  amount: model.bigNumber(),
  description: model.text().nullable(),
  data: model.json().nullable(),
})

export default CommissionLine
