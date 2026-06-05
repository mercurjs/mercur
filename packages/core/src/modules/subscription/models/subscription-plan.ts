import { model } from "@medusajs/framework/utils"
import SubscriptionOverride from "./subscription-override"

const SubscriptionPlan = model
  .define("SubscriptionPlan", {
    id: model.id({ prefix: "subplan" }).primaryKey(),
    currency_code: model.text().searchable(),
    monthly_amount: model.bigNumber(),
    free_months: model.number().default(0),
    requires_orders: model.boolean().default(false),
    metadata: model.json().nullable(),
    overrides: model.hasMany(() => SubscriptionOverride, {
      mappedBy: "plan",
    }),
  })
  .indexes([
    {
      name: "IDX_subscription_plan_unique_currency",
      on: ["currency_code"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])
  .cascades({
    delete: ["overrides"],
  })

export default SubscriptionPlan
