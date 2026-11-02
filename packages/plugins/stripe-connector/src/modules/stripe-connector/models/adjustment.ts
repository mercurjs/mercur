import { model } from "@medusajs/framework/utils"
import { PayoutStatus } from "@mercurjs/types"

import { AdjustmentType } from "../../../types/common"
import { SettlementLine } from "./settlement-line"

export const Adjustment = model
  .define({ name: "adjustment", tableName: "stripe_adjustment" }, {
    id: model.id({ prefix: "adj" }).primaryKey(),
    account_id: model.text(),
    type: model.enum(AdjustmentType),
    amount: model.bigNumber(),
    currency_code: model.text(),
    reason: model.text().nullable(),
    created_by: model.text().nullable(),
    status: model.enum(PayoutStatus).default(PayoutStatus.PENDING),
    status_reason: model.text().nullable(),
    provider_transfer_id: model.text().nullable(),
    data: model.json().nullable(),
    settlement_lines: model.hasMany(() => SettlementLine, {
      mappedBy: "adjustment",
    }),
  })
  .indexes([
    {
      name: "IDX_stripe_adjustment_account_id_status",
      on: ["account_id", "status"],
      where: "deleted_at IS NULL",
    },
  ])
