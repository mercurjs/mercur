import { MedusaContainer } from '@medusajs/framework'
import { LinkDefinition } from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { createProductsWorkflow } from '@medusajs/medusa/core-flows'
import { StepResponse } from '@medusajs/workflows-sdk'

import { AlgoliaEvents } from '../../modules/algolia/types'
import { SELLER_MODULE } from '../../modules/seller'

const getVariantInventoryItemIds = async (
  variantId: string,
  container: MedusaContainer
) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const items = await query.graph({
    entity: 'product_variant',
    fields: ['inventory_items.inventory_item_id'],
    filters: {
      id: variantId
    }
  })

  return items.data
    .map((item) => item.inventory_items.map((ii) => ii.inventory_item_id))
    .flat(2)
}

createProductsWorkflow.hooks.productsCreated(
  async ({ products, additional_data }, { container }) => {
    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    if (!additional_data?.seller_id) {
      return new StepResponse(undefined, null)
    }

    const variants = products.map((p) => p.variants).flat()

    const remoteLinks: LinkDefinition[] = products.map((product) => ({
      [SELLER_MODULE]: {
        seller_id: additional_data.seller_id
      },
      [Modules.PRODUCT]: {
        product_id: product.id
      }
    }))

    for (const variant of variants) {
      if (variant.manage_inventory) {
        const inventoryItemIds = await getVariantInventoryItemIds(
          variant.id,
          container
        )

        inventoryItemIds.forEach((inventory_item_id) => {
          remoteLinks.push({
            [SELLER_MODULE]: {
              seller_id: additional_data.seller_id
            },
            [Modules.INVENTORY]: {
              inventory_item_id
            }
          })
        })
      }
    }

    await remoteLink.create(remoteLinks)

    await container.resolve(Modules.EVENT_BUS).emit({
      name: AlgoliaEvents.PRODUCTS_CHANGED,
      data: { ids: products.map((product) => product.id) }
    })

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
