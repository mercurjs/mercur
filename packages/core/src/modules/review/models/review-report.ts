import { model } from "@medusajs/framework/utils"

const ReviewReport = model.define("review_report", {
  id: model.id({ prefix: "revrep" }).primaryKey(),
  review_id: model.text(),
  seller_id: model.text(),
  reason: model.enum([
    "irrelevant_content",
    "spam",
    "inappropriate_language",
    "bullying_or_harassment",
    "personal_information",
  ]),
  status: model.enum(["pending", "confirmed", "rejected"]).default("pending"),
})

export default ReviewReport
