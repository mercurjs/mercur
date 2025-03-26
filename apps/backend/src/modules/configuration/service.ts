import { MedusaService } from '@medusajs/framework/utils'

import { ConfigurationRule } from './models'
import { ConfigurationRuleType } from './types'

export const ConfigurationRuleDefaults = new Map<
  ConfigurationRuleType,
  boolean
>([
  [ConfigurationRuleType.GLOBAL_PRODUCT_CATALOG, true],
  [ConfigurationRuleType.PRODUCT_REQUEST_ENABLED, false],
  [ConfigurationRuleType.REQUIRE_PRODUCT_APPROVAL, true],
  [ConfigurationRuleType.PRODUCT_IMPORT_ENABLED, true]
])

class ConfigurationModuleService extends MedusaService({
  ConfigurationRule
}) {
  async isRuleEnabled(type: ConfigurationRuleType): Promise<boolean> {
    const [rule] = await this.listConfigurationRules({
      rule_type: type
    })
    return rule ? rule.is_enabled : ConfigurationRuleDefaults.get(type)!
  }
}

export default ConfigurationModuleService
