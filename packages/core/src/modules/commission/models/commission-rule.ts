import { model } from "@medusajs/framework/utils"

import CommissionRate from "./commission-rate"

const CommissionRule = model.define("commission_rule", {
  id: model.id({ prefix: "comrule" }).primaryKey(),
  reference: model.text(),
  reference_id: model.text(),
  commission_rate: model.belongsTo(() => CommissionRate, {
    mappedBy: "rules",
  }),
})

export default CommissionRule
