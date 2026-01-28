import { model } from "@medusajs/framework/utils"
import { CommissionRateType, CommissionRateTarget } from "@mercurjs/types"

import CommissionRule from "./commission-rule"

const CommissionRate = model.define("commission_rate", {
  id: model.id({ prefix: "comrate" }).primaryKey(),
  is_enabled: model.boolean().default(true),
  priority: model.number().default(0),
  currency_code: model.text().nullable(),
  name: model.text(),
  code: model.text().unique(),
  type: model.enum(CommissionRateType),
  target: model.enum(CommissionRateTarget).default(CommissionRateTarget.ITEM),
  value: model.bigNumber(),
  min_amount: model.bigNumber().nullable(),
  is_tax_inclusive: model.boolean().default(false),
  rules: model.hasMany(() => CommissionRule, {
    mappedBy: "commission_rate",
  }),
})

export default CommissionRate
