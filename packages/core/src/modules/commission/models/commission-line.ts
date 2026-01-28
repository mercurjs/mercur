import { model } from "@medusajs/framework/utils"

const CommissionLine = model.define("commission_line", {
  id: model.id({ prefix: "comline" }).primaryKey(),
  item_id: model.text(),
  commission_rate_id: model.text().nullable(),
  code: model.text(),
  rate: model.float(),
  description: model.text().nullable(),
})

export default CommissionLine
