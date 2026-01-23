import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { LinkDefinition } from "@medusajs/framework/types"

import { SELLER_MODULE } from "../../modules/seller"

createProductsWorkflow.hooks.productsCreated(
  async ({ products, additional_data }, { container }) => {
    if (!additional_data?.seller_id) {
      return new StepResponse([], [])
    }

    const link = container.resolve(ContainerRegistrationKeys.LINK)

    const links: LinkDefinition[] = []

    for (const product of products) {
      links.push({
        [SELLER_MODULE]: {
          seller_id: additional_data.seller_id,
        },
        [Modules.PRODUCT]: {
          product_id: product.id,
        },
      })
    }

    await link.create(links)

    return new StepResponse(links, links)
  },
  async (links, { container }) => {
    if (!links?.length) {
      return
    }

    const link = container.resolve(ContainerRegistrationKeys.LINK)

    await link.dismiss(links)
  }
)
