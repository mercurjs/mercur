import { MedusaService } from "@medusajs/framework/utils";

import { ConfigurationRule } from "./models";
import {
  ConfigurationRuleDefaults,
  ConfigurationRuleType,
} from "@mercurjs/framework";

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
