import { model } from "@medusajs/framework/utils"
import SubscriptionPlan from "./subscription-plan"

const SubscriptionOverride = model
  .define("SubscriptionOverride", {
    id: model.id({ prefix: "subovr" }).primaryKey(),
    reference: model.text(),
    reference_id: model.text(),
    plan: model.belongsTo(() => SubscriptionPlan, {
      mappedBy: "overrides",
    }),
    monthly_amount: model.bigNumber().nullable(),
    free_months: model.number().nullable(),
    free_from: model.dateTime().nullable(),
    free_to: model.dateTime().nullable(),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_subscription_override_unique_reference",
      on: ["reference", "reference_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_subscription_override_reference_id",
      on: ["reference_id"],
      where: "deleted_at IS NULL",
    },
  ])

export default SubscriptionOverride
