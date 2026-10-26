import { model } from "@medusajs/framework/utils"

import { SettlementStatus } from "@mercurjs/types"
import { PayoutAccount } from "./payout-account"
import { Payout } from "./payout"
import { Transfer } from "./transfer"

export const Settlement = model
  .define("settlement", {
    id: model.id({ prefix: "stl" }).primaryKey(),
    display_id: model.autoincrement(),
    provider_id: model.text(),
    currency_code: model.text(),
    period_start: model.dateTime(),
    period_end: model.dateTime(),
    transfers_total: model.bigNumber(),
    reversals_total: model.bigNumber(),
    adjustments_total: model.bigNumber(),
    amount: model.bigNumber(),
    status: model.enum(SettlementStatus).default(SettlementStatus.OPEN),
    account: model.belongsTo(() => PayoutAccount, {
      mappedBy: "settlements",
    }),
    payouts: model.hasMany(() => Payout, {
      mappedBy: "settlement",
    }),
    transfers: model.hasMany(() => Transfer, {
      mappedBy: "settlement",
    }),
  })
  .indexes([
    {
      name: "IDX_settlement_account_currency_period_end",
      on: ["account_id", "currency_code", "period_end"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_settlement_status",
      on: ["status"],
      where: "deleted_at IS NULL",
    },
  ])
