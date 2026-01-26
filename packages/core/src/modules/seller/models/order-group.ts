import { model } from "@medusajs/framework/utils"

const OrderGroup = model.define("order_group", {
  id: model.id({ prefix: 'og' }).primaryKey(),
  seller_count: model.number().computed(),
  customer_id: model.text(),
  total: model.bigNumber().computed(),
  cart_id: model.text(),
})

export default OrderGroup
