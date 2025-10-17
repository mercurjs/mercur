import { CreatePromotionRuleDTO } from '@medusajs/framework/types'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'
import { createStep } from '@medusajs/framework/workflows-sdk'

import sellerProduct from '../../../links/seller-product'

export const verifyVendorTargetPromotionRulesStep = createStep(
  'verify-vendor-target-promotion-rules',
  async (
    input: { rules?: CreatePromotionRuleDTO[]; seller_id: string },
    { container }
  ) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const nonProductAttributes =
      input.rules
        ?.map((p) => p.attribute)
        .filter((attr) => attr !== 'items.product.id') || []

    if (nonProductAttributes.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Invalid attribute!'
      )
    }

    const products = input.rules?.map((p) => p.values).flat() || []

    const { data: relations } = await query.graph({
      entity: sellerProduct.entryPoint,
      fields: ['id'],
      filters: {
        seller_id: input.seller_id,
        product_id: products
      }
    })

    if (relations.length !== products.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Vendor Promotion can be applied only to seller own products!'
      )
    }
  }
)
