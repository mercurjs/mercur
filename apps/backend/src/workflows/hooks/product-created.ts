import { MedusaContainer } from '@medusajs/framework'
import { LinkDefinition } from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { createProductsWorkflow } from '@medusajs/medusa/core-flows'
import { StepResponse } from '@medusajs/workflows-sdk'

import { AlgoliaEvents } from '@mercurjs/framework'
import { SELLER_MODULE } from '@mercurjs/seller'

import sellerShippingProfile from '../../links/seller-shipping-profile'
import { productsCreatedHookHandler } from '../attribute/utils'

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

const assignDefaultSellerShippingProfile = async (
  container: MedusaContainer,
  product_id: string,
  seller_id: string
) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)

  const {
    data: [existingLink]
  } = await query.graph({
    entity: 'product_shipping_profile',
    fields: ['*'],
    filters: {
      product_id
    }
  })

  if (existingLink) {
    return
  }

  const { data: shippingProfiles } = await query.graph({
    entity: sellerShippingProfile.entryPoint,
    fields: ['shipping_profile.id', 'shipping_profile.type'],
    filters: {
      seller_id
    }
  })

  const [profile] = shippingProfiles.filter(
    (relation) => relation.shipping_profile.type === 'default'
  )

  if (!profile) {
    return
  }

  await link.create({
    [Modules.PRODUCT]: {
      product_id
    },
    [Modules.FULFILLMENT]: {
      shipping_profile_id: profile.shipping_profile.id
    }
  })
}

createProductsWorkflow.hooks.productsCreated(
  async ({ products, additional_data }, { container }) => {
    await productsCreatedHookHandler({
      products,
      additional_data,
      container
    })

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

    await Promise.all(
      products.map((p) =>
        assignDefaultSellerShippingProfile(
          container,
          p.id,
          additional_data.seller_id as string
        )
      )
    )

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
