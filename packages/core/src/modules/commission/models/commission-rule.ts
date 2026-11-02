import { model } from "@medusajs/framework/utils"

import CommissionRate from "./commission-rate"

const CommissionRule = model
  .define("commission_rule", {
    id: model.id({ prefix: "comrule" }).primaryKey(),
    reference: model.text(),
    reference_id: model.text(),
    commission_rate: model.belongsTo(() => CommissionRate, {
      mappedBy: "rules",
    }),
  })
  .indexes([
    {
      name: "IDX_commission_rule_reference_reference_id",
      on: ["reference", "reference_id"],
      where: "deleted_at IS NULL",
    },
  ])

export default CommissionRule
