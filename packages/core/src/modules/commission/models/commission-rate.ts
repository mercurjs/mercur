import { model } from "@medusajs/framework/utils"
import { CommissionRateType } from "@mercurjs/types"

import CommissionRule from "./commission-rule"
import CommissionRateValue from "./commission-rate-value"

const CommissionRate = model.define("commission_rate", {
  id: model.id({ prefix: "comrate" }).primaryKey(),
  is_enabled: model.boolean().default(true),
  is_default: model.boolean().default(false),
  currency_code: model.text().nullable(),
  name: model.text().searchable(),
  code: model.text().unique().searchable(),
  type: model.enum(CommissionRateType),
  value: model.bigNumber(),
  include_tax: model.boolean().default(false),
  include_shipping: model.boolean().default(false),
  rules: model.hasMany(() => CommissionRule, {
    mappedBy: "commission_rate",
  }),
  values: model.hasMany(() => CommissionRateValue, {
    mappedBy: "commission_rate",
  }),
})

export default CommissionRate
