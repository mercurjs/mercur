import { model } from "@medusajs/framework/utils"
import { ReturnRequestActorType, ReturnRequestStatus } from "@mercurjs/types"

const ReturnRequest = model
  .define("ReturnRequest", {
    id: model.id({ prefix: "retreq" }).primaryKey(),
    status: model
      .enum(ReturnRequestStatus)
      .default(ReturnRequestStatus.PENDING),
    return_id: model.text(),
    order_id: model.text(),
    seller_id: model.text(),
    customer_id: model.text().nullable(),
    requested_by: model.text().nullable(),
    requested_by_type: model.enum(ReturnRequestActorType),
    attachments: model.array().default([]),
    return_required: model.boolean().nullable(),
    accepted_by: model.text().nullable(),
    accepted_by_type: model.enum(ReturnRequestActorType).nullable(),
    accepted_at: model.dateTime().nullable(),
    declined_by: model.text().nullable(),
    declined_by_type: model.enum(ReturnRequestActorType).nullable(),
    declined_at: model.dateTime().nullable(),
    decline_code: model.text().nullable(),
    decline_reason: model.text().nullable(),
    refunded_by: model.text().nullable(),
    refunded_at: model.dateTime().nullable(),
    refund_amount: model.bigNumber().nullable(),
    refund_note: model.text().nullable(),
    withdrawn_at: model.dateTime().nullable(),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_return_request_return_id",
      on: ["return_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_return_request_order_id",
      on: ["order_id"],
      unique: false,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_return_request_seller_id_status",
      on: ["seller_id", "status"],
      unique: false,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_return_request_customer_id",
      on: ["customer_id"],
      unique: false,
      where: "deleted_at IS NULL",
    },
  ])

export default ReturnRequest
