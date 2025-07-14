import { MedusaService } from "@medusajs/framework/utils";

import { ConfigurationRule } from "./models";
import { ConfigurationRuleType } from "@mercurjs/framework";

export const ConfigurationRuleDefaults = new Map<
  ConfigurationRuleType,
  boolean
>([
  [ConfigurationRuleType.GLOBAL_PRODUCT_CATALOG, false],
  [ConfigurationRuleType.PRODUCT_REQUEST_ENABLED, true],
  [ConfigurationRuleType.REQUIRE_PRODUCT_APPROVAL, false],
  [ConfigurationRuleType.PRODUCT_IMPORT_ENABLED, true],
]);

/**
 * @class ConfigurationModuleService
 * @description The configuration module service.
 */
class ConfigurationModuleService extends MedusaService({
  ConfigurationRule,
}) {
  /**
 * *
 * This method checks if a rule is enabled based on its type.
 * 
 * @param {ConfigurationRuleType} type - Rule type being evaluated for activation status
 * @returns {Promise<boolean>} The activation status of the rule.

 */
  async isRuleEnabled(type: ConfigurationRuleType): Promise<boolean> {
    const [rule] = await this.listConfigurationRules({
      rule_type: type,
    });
    return rule ? rule.is_enabled : ConfigurationRuleDefaults.get(type)!;
  }
}

export default ConfigurationModuleService;
