import { model } from "@medusajs/framework/utils";

/**
 * @class ConfigurationRule
 * @description Represents a configuration rule in the system.
 *
 * This model defines the structure for storing configuration rule information. Each configuration
 * rule is associated with a specific type and can be enabled or disabled.
 */
export const ConfigurationRule = model.define("configuration_rule", {
  /**
   * @property {string} id - Unique identifier for the configuration rule
   * @description Auto-generated primary key with prefix 'conf'
   * @example "conf_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  id: model.id({ prefix: "conf" }).primaryKey(),

  /**
   * @property {string} rule_type - The type of the configuration rule
   * @description The type of the configuration rule
   * @example "global_product_catalog"
   */
  rule_type: model
    .enum([
      "global_product_catalog",
      "require_product_approval",
      "product_request_enabled",
      "product_import_enabled",
    ])
    .unique(),

  /**
   * @property {boolean} is_enabled - The is enabled of the configuration rule
   * @description The is enabled of the configuration rule
   * @example true
   */
  is_enabled: model.boolean(),
});
