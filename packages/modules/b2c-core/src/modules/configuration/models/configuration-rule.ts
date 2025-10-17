import { model } from "@medusajs/framework/utils";

export const ConfigurationRule = model.define("configuration_rule", {
  id: model.id({ prefix: "conf" }).primaryKey(),
  rule_type: model
    .enum([
      "global_product_catalog",
      "require_product_approval",
      "product_request_enabled",
      "product_import_enabled",
    ])
    .unique(),
  is_enabled: model.boolean(),
});
