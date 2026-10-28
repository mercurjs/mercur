import { model } from "@medusajs/framework/utils"

import { CaptureStatus } from "../../../types/common"

export const StripeCapture = model
  .define({ name: "stripe_capture", tableName: "stripe_capture" }, {
    id: model.id({ prefix: "scap" }).primaryKey(),
    order_group_id: model.text(),
    payment_collection_id: model.text(),
    payment_id: model.text(),
    currency_code: model.text(),
    authorized_amount: model.bigNumber(),
    capturable_amount: model.bigNumber(),
    orders_total: model.number().default(0),
    orders_decided: model.number().default(0),
    status: model.enum(CaptureStatus).default(CaptureStatus.PENDING),
    status_reason: model.text().nullable(),
    authorized_at: model.dateTime().nullable(),
    expires_at: model.dateTime().nullable(),
  })
  .indexes([
    {
      name: "IDX_stripe_capture_order_group_id",
      on: ["order_group_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_stripe_capture_status_expires_at",
      on: ["status", "expires_at"],
      where: "deleted_at IS NULL",
    },
  ])
