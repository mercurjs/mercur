import { createProductVariantsWorkflow } from "@medusajs/medusa/core-flows"
import { StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { LinkDefinition } from "@medusajs/framework/types"
import { Link } from "@medusajs/framework/modules-sdk"
import { MercurModules } from "@mercurjs/types"

createProductVariantsWorkflow.hooks.productVariantsCreated(
  async ({ product_variants, additional_data }, { container }) => {
    if (!additional_data?.seller_id) {
      return new StepResponse(
        { inventoryLinks: [] as LinkDefinition[] },
        { inventoryLinks: [] as LinkDefinition[] }
      )
    }

    const link: Link = container.resolve(ContainerRegistrationKeys.LINK)
    const query: any = container.resolve(ContainerRegistrationKeys.QUERY)

    const inventoryLinks: LinkDefinition[] = []

    const variantIds = product_variants
      .filter((v) => v.manage_inventory)
      .map((v) => v.id)

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

    if (inventoryLinks.length) {
      await link.create(inventoryLinks)
    }

    return new StepResponse(
      { inventoryLinks },
      { inventoryLinks }
    )
  },
  async (data, { container }) => {
    if (!data) {
      return
    }

    const { inventoryLinks } = data

    const link: Link = container.resolve(ContainerRegistrationKeys.LINK)

    if (inventoryLinks?.length) {
      await link.dismiss(inventoryLinks)
    }
  }
)
