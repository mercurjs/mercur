import { MedusaContainer } from '@medusajs/framework'
import {
  CreatePriceListPriceWorkflowDTO,
  UpdatePriceListPriceWorkflowDTO
} from '@medusajs/framework/types'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import sellerProduct from '../../../links/seller-product'

async function validateVariantOwnership(
  container: MedusaContainer,
  seller_id: string,
  variantIds: string[]
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: products } = await query.graph({
    entity: 'product_variant',
    fields: ['product_id'],
    filters: {
      id: variantIds
    }
  })

  const productIds = [...new Set(products.map((p) => p.product_id))]

  const { data: relations } = await query.graph({
    entity: sellerProduct.entryPoint,
    fields: ['id'],
    filters: {
      seller_id,
      product_id: productIds
    }
  })

  if (relations.length !== productIds.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'Price lists can be applied only to seller own products!'
    )
  }
}

async function validatePrices(
  container: MedusaContainer,
  priceIds: string[],
  price_list_id?: string
) {
  if (!price_list_id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'Update requires price list id!'
    )
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [list]
  } = await query.graph({
    entity: 'price_list',
    fields: ['prices.id'],
    filters: {
      id: price_list_id
    }
  })

  const prices = list.prices.map((p) => p.id) as string[]

  for (const price of priceIds) {
    if (!prices.includes(price)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Invalid price id!')
    }
  }
}

export const validateVendorPriceListPricesStep = createStep(
  'validate-vendor-price-list-prices',
  async (
    input: {
      create?: CreatePriceListPriceWorkflowDTO[]
      update?: UpdatePriceListPriceWorkflowDTO[]
      price_list_id?: string
      seller_id: string
    },
    { container }
  ) => {
    if (input.create) {
      await validateVariantOwnership(
        container,
        input.seller_id,
        input.create.map((price) => price.variant_id)
      )
    }

    if (input.update) {
      await validatePrices(
        container,
        input.update.map((p) => p.id),
        input.price_list_id
      )
    }

    return new StepResponse()
  }
)
