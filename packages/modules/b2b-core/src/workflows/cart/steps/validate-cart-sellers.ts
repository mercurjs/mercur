import { CartLineItemDTO } from '@medusajs/framework/types'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'
import { createStep } from '@medusajs/framework/workflows-sdk'

import { StoreStatus } from '@mercurjs/framework'

import sellerProduct from '../../../links/seller-product'

type LineItemWithProductId = Pick<CartLineItemDTO, 'product_id'>

export const validateCartSellersStep = createStep(
  'validate-cart-sellers',
  async (input: { line_items: LineItemWithProductId[] }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    if (!input.line_items?.length) {
      return
    }

    const productIds = input.line_items.map((item) => item.product_id)

    const { data: sellerProducts } = await query.graph({
      entity: sellerProduct.entryPoint,
      fields: ['seller.store_status'],
      filters: {
        product_id: productIds
      }
    })

    const hasInactiveSellers = sellerProducts.some(
      (sp) => sp.seller.store_status !== StoreStatus.ACTIVE
    )

    if (hasInactiveSellers) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        'Some products in the cart belong to inactive sellers'
      )
    }
  }
)
