import { Link } from "@medusajs/framework/modules-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

export interface DetachSellersFromProductCategoryStepInput {
  links: {
    category_id: string
    seller_id: string
  }[]
}

export const detachSellersFromProductCategoryStepId =
  "detach-sellers-from-product-category"

export const detachSellersFromProductCategoryStep = createStep(
  detachSellersFromProductCategoryStepId,
  async (input: DetachSellersFromProductCategoryStepInput, { container }) => {
    if (!input.links?.length) {
      return new StepResponse(void 0, [])
    }

    const remoteLink: Link = container.resolve(
      ContainerRegistrationKeys.LINK
    )

    const links = input.links.map((link) => ({
      [Modules.PRODUCT]: { product_category_id: link.category_id },
      [MercurModules.SELLER]: { seller_id: link.seller_id },
    }))

    await remoteLink.dismiss(links)
    return new StepResponse(void 0, links)
  },
  async (links, { container }) => {
    if (!links?.length) {
      return
    }

    const remoteLink: Link = container.resolve(
      ContainerRegistrationKeys.LINK
    )
    await remoteLink.create(links)
  }
)
