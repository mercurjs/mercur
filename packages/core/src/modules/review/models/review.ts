import { model } from "@medusajs/framework/utils"

const Review = model.define("review", {
  id: model.id({ prefix: "rev" }).primaryKey(),
  display_id: model.autoincrement(),
  reference: model.enum(["product", "seller"]),
  rating: model.number(),
  customer_note: model.text().searchable().nullable(),
  seller_note: model.text().searchable().nullable(),
  status: model.enum(["pending", "published", "rejected"]).default("pending"),
})

export default Review
