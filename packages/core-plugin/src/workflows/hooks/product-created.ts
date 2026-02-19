import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { LinkDefinition } from "@medusajs/framework/types"
import { Link, Query } from "@medusajs/framework/modules-sdk"
import { MercurModules } from "@mercurjs/types"

createProductsWorkflow.hooks.productsCreated(
  async ({ products, additional_data }, { container }) => {
    if (!additional_data?.seller_id) {
      return new StepResponse(
        { productLinks: [] as LinkDefinition[], inventoryLinks: [] as LinkDefinition[] },
        { productLinks: [] as LinkDefinition[], inventoryLinks: [] as LinkDefinition[] }
      )
    }

    const link: Link = container.resolve(ContainerRegistrationKeys.LINK)
    const query: Query = container.resolve(ContainerRegistrationKeys.QUERY)

    const links: LinkDefinition[] = []
    const inventoryLinks: LinkDefinition[] = []

    const variantIds: string[] = []

    for (const product of products) {
      links.push({
        [Modules.PRODUCT]: {
          product_id: product.id,
        },
        [MercurModules.SELLER]: {
          seller_id: additional_data.seller_id,
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
            [Modules.INVENTORY]: {
              inventory_item_id: inventoryItem.inventory_item_id,
            },
            [MercurModules.SELLER]: {
              seller_id: additional_data.seller_id,
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

    const link: Link = container.resolve(ContainerRegistrationKeys.LINK)

    if (productLinks?.length) {
      await link.dismiss(productLinks)
    }

    if (inventoryLinks?.length) {
      await link.dismiss(inventoryLinks)
    }
  }
)
