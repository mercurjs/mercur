import { model } from "@medusajs/framework/utils"

import { SettlementLineType } from "../../../types/common"
import { Settlement } from "./settlement"

export const SettlementLine = model
  .define({ name: "settlement_line", tableName: "stripe_settlement_line" }, {
    id: model.id({ prefix: "stlln" }).primaryKey(),
    type: model.enum(SettlementLineType),
    source_id: model.text(),
    amount: model.bigNumber(),
    settlement: model.belongsTo(() => Settlement, {
      mappedBy: "lines",
    }),
  })
  .indexes([
    {
      name: "IDX_stripe_settlement_line_source_id",
      on: ["source_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])
