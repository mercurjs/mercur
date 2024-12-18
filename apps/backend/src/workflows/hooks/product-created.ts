import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { createProductsWorkflow } from '@medusajs/medusa/core-flows'
import { StepResponse } from '@medusajs/workflows-sdk'

import { SELLER_MODULE } from '../../modules/seller'

createProductsWorkflow.hooks.productsCreated(
  async ({ products, additional_data }, { container }) => {
    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    if (!additional_data?.seller_id) {
      return new StepResponse(undefined, null)
    }

    const remoteLinks = products.map((product) => ({
      [SELLER_MODULE]: {
        seller_id: additional_data.seller_id
      },
      [Modules.PRODUCT]: {
        product_id: product.id
      }
    }))

    await remoteLink.create(remoteLinks)

    return new StepResponse(
      undefined,
      products.map((product) => product.id)
    )
  },
  async (productIds: string[] | null, { container }) => {
    if (!productIds) {
      return
    }

    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    await remoteLink.dismiss(
      productIds.map((productId) => ({
        [Modules.PRODUCT]: {
          product_id: productId
        }
      }))
    )
  }
)
