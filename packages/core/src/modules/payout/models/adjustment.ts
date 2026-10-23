import { model } from "@medusajs/framework/utils"

import { AdjustmentType } from "@mercurjs/types"
import { PayoutAccount } from "./payout-account"

export const Adjustment = model
  .define("adjustment", {
    id: model.id({ prefix: "adj" }).primaryKey(),
    type: model.enum(AdjustmentType),
    amount: model.bigNumber(),
    currency_code: model.text(),
    reason: model.text().nullable(),
    created_by: model.text().nullable(),
    transfer_id: model.text().nullable(),
    account: model.belongsTo(() => PayoutAccount, {
      mappedBy: "adjustments",
    }),
  })
  .indexes([
    {
      name: "IDX_adjustment_account_id_transfer_id",
      on: ["account_id", "transfer_id"],
      where: "deleted_at IS NULL",
    },
  ])
