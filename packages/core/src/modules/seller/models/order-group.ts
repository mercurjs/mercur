import { model } from "@medusajs/framework/utils"

const OrderGroup = model
  .define("order_group", {
    id: model.id({ prefix: 'og' }).primaryKey(),
    display_id: model.autoincrement(),
    seller_count: model.number().computed(),
    customer_id: model.text().nullable(),
    total: model.bigNumber().computed(),
    cart_id: model.text(),
  })
  .indexes([
    {
      name: "IDX_order_group_cart_id",
      on: ["cart_id"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_order_group_customer_id_created_at",
      on: ["customer_id", "created_at"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_order_group_created_at",
      on: ["created_at"],
      where: "deleted_at IS NULL",
    },
  ])

export default OrderGroup
