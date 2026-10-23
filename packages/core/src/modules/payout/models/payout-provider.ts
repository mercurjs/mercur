import { model } from "@medusajs/framework/utils"

// Named "record" so the generated repository service does not take the
// `payoutProviderService` container key the provider facade already uses.
export const PayoutProviderRecord = model.define(
  { name: "payout_provider_record", tableName: "payout_provider" },
  {
    id: model.id().primaryKey(),
    is_enabled: model.boolean().default(true),
  }
)
