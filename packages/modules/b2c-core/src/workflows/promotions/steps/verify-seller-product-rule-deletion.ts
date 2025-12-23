import { MedusaError, Modules } from '@medusajs/framework/utils'
import { createStep } from '@medusajs/framework/workflows-sdk'

import { SELLER_PRODUCTS_RULE_DESCRIPTION } from './inject-seller-product-rule'

/**
 * Verifies that the default seller products rule cannot be deleted.
 * This rule is automatically added when creating a vendor promotion
 * and ensures promotions only apply to the seller's own products.
 */
export const verifySellerProductRuleDeletionStep = createStep(
  'verify-seller-product-rule-deletion',
  async (
    input: { promotion_id: string; rule_ids_to_delete: string[] },
    { container }
  ) => {
    if (!input.rule_ids_to_delete || input.rule_ids_to_delete.length === 0) {
      return
    }

    const promotionModuleService = container.resolve(Modules.PROMOTION)

    const promotion = await promotionModuleService.retrievePromotion(
      input.promotion_id,
      {
        relations: ['application_method.target_rules']
      }
    )

    const targetRules = promotion.application_method?.target_rules || []

    const sellerProductsRule = targetRules.find(
      (rule) => rule.description === SELLER_PRODUCTS_RULE_DESCRIPTION
    )

    if (
      sellerProductsRule &&
      input.rule_ids_to_delete.includes(sellerProductsRule.id)
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Cannot delete the default seller products rule. This rule ensures the promotion only applies to your products.'
      )
    }
  }
)
