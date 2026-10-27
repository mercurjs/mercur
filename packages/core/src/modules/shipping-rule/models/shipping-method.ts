import { model } from "@medusajs/framework/utils"

import ShippingRule from "./shipping-rule"

// The cart module already owns a `ShippingMethod` entity; query entity names
// are global, so this one carries a distinct name.
const MarketplaceShippingMethod = model
  .define(
    {
      name: "MarketplaceShippingMethod",
      tableName: "marketplace_shipping_method",
    },
    {
      id: model.id({ prefix: "shmeth" }).primaryKey(),
      name: model.text(),
      code: model.text(),
      description: model.text().nullable(),
      provider_id: model.text(),
      shipping_option_type_id: model.text(),
      is_active: model.boolean().default(true),
      metadata: model.json().nullable(),
      rules: model.hasMany(() => ShippingRule, {
        mappedBy: "shipping_method",
      }),
    }
  )
  .cascades({
    delete: ["rules"],
  })
  .indexes([
    {
      name: "IDX_marketplace_shipping_method_code_unique",
      on: ["code"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])

export default MarketplaceShippingMethod
