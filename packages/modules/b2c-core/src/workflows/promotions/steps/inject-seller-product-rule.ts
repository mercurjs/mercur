import { CreatePromotionDTO } from '@medusajs/framework/types'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'
import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'

import sellerProduct from '../../../links/seller-product'

export const SELLER_PRODUCTS_RULE_DESCRIPTION = 'seller_products_default_rule'

export const injectSellerProductRuleStep = createStep(
  'inject-seller-product-rule',
  async (
    input: { promotion: CreatePromotionDTO; seller_id: string },
    { container }
  ) => {
    if (input.promotion.application_method.target_rules && input.promotion.application_method.target_rules.length > 0) {
      return new StepResponse(input.promotion)
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data: sellerProducts } = await query.graph({
      entity: sellerProduct.entryPoint,
      fields: ['product_id'],
      filters: {
        seller_id: input.seller_id
      }
    })

    const productIds = sellerProducts.map((sp) => sp.product_id)

    if (productIds.length === 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Seller has no products. Cannot create a promotion without products.'
      )
    }

    const existingTargetRules =
      input.promotion.application_method?.target_rules || []

    const sellerProductRule = {
      attribute: 'items.product.id',
      operator: 'in' as const,
      values: productIds,
      description: SELLER_PRODUCTS_RULE_DESCRIPTION
    }

    const promotionWithDefaultRule: CreatePromotionDTO = {
      ...input.promotion,
      application_method: {
        ...input.promotion.application_method,
        target_rules: [sellerProductRule, ...existingTargetRules]
      }
    }

    return new StepResponse(promotionWithDefaultRule)
  }
)
