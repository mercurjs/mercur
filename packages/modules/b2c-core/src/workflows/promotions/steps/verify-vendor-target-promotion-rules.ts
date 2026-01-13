import { CreatePromotionRuleDTO } from '@medusajs/framework/types'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'
import { createStep } from '@medusajs/framework/workflows-sdk'

import sellerProduct from '../../../links/seller-product'
import { SELLER_PRODUCTS_RULE_DESCRIPTION } from './inject-seller-product-rule'

/**
 * Verifies that any product-based target rules in a promotion only reference
 * products that belong to the seller. Other attribute types (category, collection, etc.)
 * are allowed and will be combined with the default seller products rule using AND logic.
 */
export const verifyVendorTargetPromotionRulesStep = createStep(
  'verify-vendor-target-promotion-rules',
  async (
    input: { rules?: CreatePromotionRuleDTO[]; seller_id: string },
    { container }
  ) => {
    if (!input.rules || input.rules.length === 0) {
      return
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const productRules = input.rules.filter(
      (rule) =>
        rule.attribute === 'items.product.id' &&
        rule.description !== SELLER_PRODUCTS_RULE_DESCRIPTION
    )

    if (productRules.length === 0) {
      return
    }

    const productIds = productRules
      .map((rule) => rule.values)
      .flat()
      .filter((value): value is string => typeof value === 'string')

    if (productIds.length === 0) {
      return
    }

    const { data: sellerProducts } = await query.graph({
      entity: sellerProduct.entryPoint,
      fields: ['product_id'],
      filters: {
        seller_id: input.seller_id,
        product_id: productIds
      }
    })

    const sellerProductIds = new Set(sellerProducts.map((sp) => sp.product_id))
    const invalidProducts = productIds.filter((id) => !sellerProductIds.has(id))

    if (invalidProducts.length > 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Vendor Promotion can be applied only to seller own products!'
      )
    }
  }
)
