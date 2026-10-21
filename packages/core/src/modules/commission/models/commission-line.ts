import { model } from "@medusajs/framework/utils"

const CommissionLine = model
  .define("commission_line", {
    id: model.id({ prefix: "comline" }).primaryKey(),
    item_id: model.text().nullable(),
    shipping_method_id: model.text().nullable(),
    commission_rate_id: model.text().nullable(),
    provider_id: model.text().default("system"),
    code: model.text(),
    rate: model.float(),
    amount: model.bigNumber(),
    description: model.text().nullable(),
    data: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_commission_line_item_id",
      on: ["item_id"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_commission_line_shipping_method_id",
      on: ["shipping_method_id"],
      where: "deleted_at IS NULL",
    },
  ])

export default CommissionLine
