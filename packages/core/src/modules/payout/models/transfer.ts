import { model } from "@medusajs/framework/utils"

import { TransferStatus, TransferType } from "@mercurjs/types"
import { PayoutAccount } from "./payout-account"
import { Settlement } from "./settlement"

export const Transfer = model
  .define("transfer", {
    id: model.id({ prefix: "trf" }).primaryKey(),
    provider_id: model.text(),
    type: model.enum(TransferType),
    order_id: model.text().nullable(),
    adjustment_id: model.text().nullable(),
    reverses_transfer_id: model.text().nullable(),
    refund_id: model.text().nullable(),
    source_payment_id: model.text().nullable(),
    provider_transfer_id: model.text().nullable(),
    amount: model.bigNumber(),
    currency_code: model.text(),
    status: model.enum(TransferStatus).default(TransferStatus.PENDING),
    status_reason: model.text().nullable(),
    source_created_at: model.dateTime().nullable(),
    data: model.json().nullable(),
    account: model.belongsTo(() => PayoutAccount, {
      mappedBy: "transfers",
    }),
    settlement: model
      .belongsTo(() => Settlement, {
        mappedBy: "transfers",
      })
      .nullable(),
  })
  .indexes([
    {
      name: "IDX_transfer_order_id_type",
      on: ["order_id", "type"],
      unique: true,
      where: "deleted_at IS NULL AND order_id IS NOT NULL",
    },
    {
      name: "IDX_transfer_refund_id",
      on: ["refund_id"],
      unique: true,
      where: "deleted_at IS NULL AND refund_id IS NOT NULL",
    },
    {
      name: "IDX_transfer_adjustment_id",
      on: ["adjustment_id"],
      unique: true,
      where: "deleted_at IS NULL AND adjustment_id IS NOT NULL",
    },
    {
      name: "IDX_transfer_status_created_at",
      on: ["status", "created_at"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_transfer_account_id_status",
      on: ["account_id", "status"],
      where: "deleted_at IS NULL",
    },
  ])
