import { model } from "@medusajs/framework/utils"

import { SettlementLineType } from "../../../types/common"
import { Adjustment } from "./adjustment"
import { Settlement } from "./settlement"

export const SettlementLine = model
  .define({ name: "settlement_line", tableName: "stripe_settlement_line" }, {
    id: model.id({ prefix: "stlln" }).primaryKey(),
    type: model.enum(SettlementLineType),
    payout_id: model.text().nullable(),
    payout_reversal_id: model.text().nullable(),
    amount: model.bigNumber(),
    settlement: model.belongsTo(() => Settlement, {
      mappedBy: "lines",
    }),
    adjustment: model
      .belongsTo(() => Adjustment, {
        mappedBy: "settlement_lines",
      })
      .nullable(),
  })
  .indexes([
    {
      name: "IDX_stripe_settlement_line_payout_id",
      on: ["payout_id"],
      unique: true,
      where: "deleted_at IS NULL AND payout_id IS NOT NULL",
    },
    {
      name: "IDX_stripe_settlement_line_payout_reversal_id",
      on: ["payout_reversal_id"],
      unique: true,
      where: "deleted_at IS NULL AND payout_reversal_id IS NOT NULL",
    },
    {
      name: "IDX_stripe_settlement_line_adjustment_id",
      on: ["adjustment_id"],
      unique: true,
      where: "deleted_at IS NULL AND adjustment_id IS NOT NULL",
    },
  ])
