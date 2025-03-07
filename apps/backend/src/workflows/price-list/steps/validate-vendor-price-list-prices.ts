import { CreatePriceListPriceWorkflowDTO } from '@medusajs/framework/types'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import sellerProduct from '../../../links/seller-product'

export const validateVendorPriceListPricesStep = createStep(
  'validate-vendor-price-list-prices',
  async (
    input: {
      prices?: CreatePriceListPriceWorkflowDTO[]
      seller_id: string
    },
    { container }
  ) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const variantIds = input.prices?.map((price) => price.variant_id) || []

    const { data: products } = await query.graph({
      entity: 'product_variant',
      fields: ['product_id'],
      filters: {
        id: variantIds
      }
    })

    const { data: relations } = await query.graph({
      entity: sellerProduct.entryPoint,
      fields: ['id'],
      filters: {
        seller_id: input.seller_id,
        product_id: products.map((p) => p.product_id)
      }
    })

    if (relations.length !== products.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Price lists can be applied only to seller own products!'
      )
    }

    return new StepResponse()
  }
)
