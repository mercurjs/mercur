import { CartDTO } from '@medusajs/framework/types'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'
import { createStep } from '@medusajs/framework/workflows-sdk'

import sellerProduct from '../../../links/seller-product'
import { StoreStatus } from '../../../modules/seller/types'

export const validateCartSellersStep = createStep(
  'validate-cart-sellers',
  async (input: { id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const {
      data: [cart]
    } = (await query.graph({
      entity: 'cart',
      fields: ['items.product_id'],
      filters: { id: input.id }
    })) as { data: CartDTO[] }

    if (!cart?.items?.length) {
      return
    }

    const productIds = cart.items.map((item) => item.product_id)

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
