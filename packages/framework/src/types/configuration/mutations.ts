import { ConfigurationRuleType } from './common'

export interface CreateConfigurationRuleDTO {
  rule_type: ConfigurationRuleType
  is_enabled: boolean
}

export interface UpdateConfigurationRuleDTO {
  id: string
  is_enabled: boolean
}
