export enum ConfigurationRuleType {
  GLOBAL_PRODUCT_CATALOG = 'global_product_catalog',
  REQUIRE_PRODUCT_APPROVAL = 'require_product_approval',
  PRODUCT_REQUEST_ENABLED = 'product_request_enabled',
  PRODUCT_IMPORT_ENABLED = 'product_import_enabled'
}

export interface ConfigurationRule {
  id: string
  rule_type: ConfigurationRuleType
  is_enabled: boolean
  created_at: Date
  updated_at: Date
}

export interface AdminCreateRule {
  rule_type: ConfigurationRuleType
  is_enabled: boolean
}
