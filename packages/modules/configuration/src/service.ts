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

class ConfigurationModuleService extends MedusaService({
  ConfigurationRule,
}) {
  async isRuleEnabled(type: ConfigurationRuleType): Promise<boolean> {
    const [rule] = await this.listConfigurationRules({
      rule_type: type,
    });
    return rule ? rule.is_enabled : ConfigurationRuleDefaults.get(type)!;
  }
}

export default ConfigurationModuleService;
