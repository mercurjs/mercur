import { BatchPromotionRulesWorkflowInput } from '@medusajs/medusa/core-flows'
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules
} from '@medusajs/framework/utils'
import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'

import sellerProduct from '../../../links/seller-product'
import { SELLER_PRODUCTS_RULE_DESCRIPTION } from './inject-seller-product-rule'

type Input = {
  batchInput: BatchPromotionRulesWorkflowInput
  seller_id: string
  promotion_id: string
}

const isProductRule = (rule?: { attribute?: string }) =>
  rule?.attribute === 'items.product.id'

const normalizeValues = (values: string | string[]) =>
  Array.isArray(values) ? values : [values]

export const ensureSellerProductRuleAfterDeletionStep = createStep(
  'ensure-seller-product-rule-after-deletion',
  async (input: Input, { container }) => {
    const { batchInput } = input

    if (batchInput.rule_type !== 'target_rules') {
      return new StepResponse(batchInput)
    }

    const createdRules = batchInput.create || []
    const productRulesToCreate = createdRules.filter(isProductRule)
    const nonProductRulesToCreate = createdRules.filter((rule) => !isProductRule(rule))
    const hasDeletions = Boolean(batchInput.delete?.length)
    const hasNewProductRule = productRulesToCreate.length > 0

    if (!hasDeletions && !hasNewProductRule) {
      return new StepResponse(batchInput)
    }

    const promotionModule = container.resolve(Modules.PROMOTION)
    const promotion = await promotionModule.retrievePromotion(input.promotion_id, {
      relations: [
        'application_method.target_rules',
        'application_method.target_rules.values'
      ]
    })

    const deleteSet = new Set(batchInput.delete || [])
    const currentRules = promotion.application_method?.target_rules || []
    const remainingRules = currentRules.filter((rule) => !deleteSet.has(rule.id))

    if (hasNewProductRule) {
      const baseRule = productRulesToCreate[0]
      const nextRule = {
        ...baseRule,
        values: normalizeValues(baseRule.values as string | string[]),
        description:
          baseRule.description === SELLER_PRODUCTS_RULE_DESCRIPTION
            ? undefined
            : baseRule.description
      }

      const existingProductRuleIds = remainingRules
        .filter(isProductRule)
        .map((rule) => rule.id)
        .filter(Boolean) as string[]

      existingProductRuleIds.forEach((id) => deleteSet.add(id))

      return new StepResponse({
        ...batchInput,
        delete: Array.from(deleteSet),
        create: [nextRule, ...nonProductRulesToCreate]
      })
    }

    const hasProductRule = remainingRules.some(isProductRule)

    if (hasProductRule) {
      return new StepResponse({
        ...batchInput,
        delete: Array.from(deleteSet)
      })
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
        'Seller has no products. Cannot remove all product rules.'
      )
    }

    const defaultRule = {
      attribute: 'items.product.id',
      operator: 'in' as const,
      values: productIds,
      description: SELLER_PRODUCTS_RULE_DESCRIPTION
    }

    return new StepResponse({
      ...batchInput,
      delete: Array.from(deleteSet),
      create: [defaultRule, ...createdRules]
    })
  }
)

