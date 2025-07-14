import { ConfigurationRuleType } from "./common";

/**
 * *
 * @interface
 * The configuration rule to be created.
 * @property {ConfigurationRuleType} rule_type - The rule type of the configuration rule
 * @property {boolean} is_enabled - Whether the configuration rule is enabled.
 */
export interface CreateConfigurationRuleDTO {
  /**
 * *
 * The rule type of the configuration rule

 */
  rule_type: ConfigurationRuleType;
  /**
 * *
 * Whether the configuration rule is enabled.

 */
  is_enabled: boolean;
}

/**
 * @interface
 * The attributes to update in the configuration rule.
 * @property {string} id - The ID of the configuration rule.
 * @property {boolean} is_enabled - Whether the configuration rule is enabled.
 */
export interface UpdateConfigurationRuleDTO {
  /**
 * *
 * The ID of the configuration rule.

 */
  id: string;
  /**
 * *
 * Whether the configuration rule is enabled.

 */
  is_enabled: boolean;
}
