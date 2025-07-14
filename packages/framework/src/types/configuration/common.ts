/**
 * *
 * @enum Configuration rule types
 */
export enum ConfigurationRuleType {
  /**
 * *
 * SUMMARY
 * 
 * @defaultValue 'global_product_catalog'

 */
  GLOBAL_PRODUCT_CATALOG = "global_product_catalog",
  /**
 * *
 * SUMMARY
 * 
 * @defaultValue 'require_product_approval'

 */
  REQUIRE_PRODUCT_APPROVAL = "require_product_approval",
  /**
 * *
 * SUMMARY
 * 
 * @defaultValue 'product_request_enabled'

 */
  PRODUCT_REQUEST_ENABLED = "product_request_enabled",
  /**
 * *
 * SUMMARY
 * 
 * @defaultValue 'product_import_enabled'

 */
  PRODUCT_IMPORT_ENABLED = "product_import_enabled",
}

/**
 * *
 * @interface
 * 
 * The configuration rule details.
 * @property {string} id - The ID of the configuration rule.
 * @property {ConfigurationRuleType} rule_type - The rule type of the configuration rule
 * @property {boolean} is_enabled - Whether the configuration rule is enabled.
 * @property {Date} created_at - The associated date.
 * @property {Date} updated_at - The associated date.

 */
export type ConfigurationRule = {
  /**
 * *
 * The ID of the entity.

 */
  id: string;
  /**
 * *
 * SUMMARY

 */
  rule_type: ConfigurationRuleType;
  /**
 * *
 * SUMMARY

 */
  is_enabled: boolean;
  /**
 * *
 * Enables basic storage and retrieval of dates and times.

 */
  created_at: Date;
  /**
 * *
 * Enables basic storage and retrieval of dates and times.

 */
  updated_at: Date;
};
