import { Link } from "@medusajs/framework/modules-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

export interface AssociateSellersWithProductBrandStepInput {
  links: {
    brand_id: string
    seller_id: string
  }[]
}

export const associateSellersWithProductBrandStepId =
  "associate-sellers-with-product-brand"

export const associateSellersWithProductBrandStep = createStep(
  associateSellersWithProductBrandStepId,
  async (
    input: AssociateSellersWithProductBrandStepInput,
    { container }
  ) => {
    if (!input.links?.length) {
      return new StepResponse([], [])
    }

    const remoteLink: Link = container.resolve(
      ContainerRegistrationKeys.LINK
    )

    const links = input.links.map((link) => ({
      [Modules.PRODUCT]: { product_brand_id: link.brand_id },
      [MercurModules.SELLER]: { seller_id: link.seller_id },
    }))

    const created = await remoteLink.create(links)
    return new StepResponse(created, links)
  },
  async (links, { container }) => {
    if (!links?.length) {
      return
    }

    const remoteLink: Link = container.resolve(
      ContainerRegistrationKeys.LINK
    )
    await remoteLink.dismiss(links)
  }
)
