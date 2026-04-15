import { Link } from "@medusajs/framework/modules-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

export interface AssociateSellersWithProductCategoryStepInput {
  links: {
    category_id: string
    seller_id: string
  }[]
}

export const associateSellersWithProductCategoryStepId =
  "associate-sellers-with-product-category"

export const associateSellersWithProductCategoryStep = createStep(
  associateSellersWithProductCategoryStepId,
  async (
    input: AssociateSellersWithProductCategoryStepInput,
    { container }
  ) => {
    if (!input.links?.length) {
      return new StepResponse([], [])
    }

    const remoteLink: Link = container.resolve(
      ContainerRegistrationKeys.LINK
    )

    const links = input.links.map((link) => ({
      [Modules.PRODUCT]: { product_category_id: link.category_id },
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
