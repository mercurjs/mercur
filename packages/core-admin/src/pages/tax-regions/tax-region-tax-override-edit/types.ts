import type { TaxRateRuleReferenceType } from "@pages/tax-regions/common/constants"
import type { TaxRateRuleReference } from "@pages/tax-regions/common/schemas"

export type InitialRuleValues = {
  [TaxRateRuleReferenceType.PRODUCT]: TaxRateRuleReference[]
  // [TaxRateRuleReferenceType.PRODUCT_COLLECTION]: TaxRateRuleReference[]
  // [TaxRateRuleReferenceType.PRODUCT_TAG]: TaxRateRuleReference[]
  [TaxRateRuleReferenceType.SHIPPING_OPTION]: TaxRateRuleReference[]
  [TaxRateRuleReferenceType.PRODUCT_TYPE]: TaxRateRuleReference[]
  // [TaxRateRuleReferenceType.CUSTOMER_GROUP]: TaxRateRuleReference[]
}
