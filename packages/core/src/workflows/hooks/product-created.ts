import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { LinkDefinition } from "@medusajs/framework/types"

import { SELLER_MODULE } from "../../modules/seller"

createProductsWorkflow.hooks.productsCreated(
  async ({ products, additional_data }, { container }) => {
    if (!additional_data?.seller_id) {
      return new StepResponse(
        { productLinks: [] as LinkDefinition[], inventoryLinks: [] as LinkDefinition[] },
        { productLinks: [] as LinkDefinition[], inventoryLinks: [] as LinkDefinition[] }
      )
    }

    const link = container.resolve(ContainerRegistrationKeys.LINK)
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const links: LinkDefinition[] = []
    const inventoryLinks: LinkDefinition[] = []

    const variantIds: string[] = []

    for (const product of products) {
      links.push({
        [SELLER_MODULE]: {
          seller_id: additional_data.seller_id,
        },
        [Modules.PRODUCT]: {
          product_id: product.id,
        },
      })

      for (const variant of product.variants || []) {
        if (variant.manage_inventory) {
          variantIds.push(variant.id)
        }
      }
    }

    if (variantIds.length) {
      const { data: variants } = await query.graph({
        entity: "variant",
        fields: ["inventory_items.inventory_item_id"],
        filters: { id: variantIds },
      })

      for (const variant of variants) {
        for (const inventoryItem of variant.inventory_items || []) {
          inventoryLinks.push({
            [SELLER_MODULE]: {
              seller_id: additional_data.seller_id,
            },
            [Modules.INVENTORY]: {
              inventory_item_id: inventoryItem.inventory_item_id,
            },
          })
        }
      }
    }

    await link.create(links)

    if (inventoryLinks.length) {
      await link.create(inventoryLinks)
    }

    return new StepResponse(
      { productLinks: links, inventoryLinks },
      { productLinks: links, inventoryLinks }
    )
  },
  async (data, { container }) => {
    if (!data) {
      return
    }

    const { productLinks, inventoryLinks } = data

    const link = container.resolve(ContainerRegistrationKeys.LINK)

    if (productLinks?.length) {
      await link.dismiss(productLinks)
    }

    if (inventoryLinks?.length) {
      await link.dismiss(inventoryLinks)
    }
  }
)
