import { model } from "@medusajs/framework/utils"
import { PayoutStatus } from "@mercurjs/types"

import { SettlementStatus } from "../../../types/common"
import { SettlementLine } from "./settlement-line"

export const Settlement = model
  .define({ name: "settlement", tableName: "stripe_settlement" }, {
    id: model.id({ prefix: "stl" }).primaryKey(),
    display_id: model.autoincrement(),
    account_id: model.text(),
    currency_code: model.text(),
    period_start: model.dateTime(),
    period_end: model.dateTime(),
    payouts_total: model.bigNumber(),
    reversals_total: model.bigNumber(),
    adjustments_total: model.bigNumber(),
    amount: model.bigNumber(),
    status: model.enum(SettlementStatus).default(SettlementStatus.OPEN),
    payout_status: model.enum(PayoutStatus).nullable(),
    provider_payout_id: model.text().nullable(),
    status_reason: model.text().nullable(),
    data: model.json().nullable(),
    lines: model.hasMany(() => SettlementLine, {
      mappedBy: "settlement",
    }),
  })
  .cascades({
    delete: ["lines"],
  })
  .indexes([
    {
      name: "IDX_stripe_settlement_account_currency_period_end",
      on: ["account_id", "currency_code", "period_end"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_stripe_settlement_status",
      on: ["status"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_stripe_settlement_provider_payout_id",
      on: ["provider_payout_id"],
      where: "deleted_at IS NULL AND provider_payout_id IS NOT NULL",
    },
  ])
