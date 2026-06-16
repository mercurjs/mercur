import { model } from "@medusajs/framework/utils"

import CommissionRate from "./commission-rate"

const CommissionRateValue = model.define("commission_rate_value", {
  id: model.id({ prefix: "comval" }).primaryKey(),
  currency_code: model.text(),
  amount: model.bigNumber(),
  commission_rate: model.belongsTo(() => CommissionRate, {
    mappedBy: "values",
  }),
})

export default CommissionRateValue
