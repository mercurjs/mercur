import { Link } from "@medusajs/framework/modules-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

export interface DetachSellersFromProductBrandStepInput {
  links: {
    brand_id: string
    seller_id: string
  }[]
}

export const detachSellersFromProductBrandStepId =
  "detach-sellers-from-product-brand"

export const detachSellersFromProductBrandStep = createStep(
  detachSellersFromProductBrandStepId,
  async (input: DetachSellersFromProductBrandStepInput, { container }) => {
    if (!input.links?.length) {
      return new StepResponse(void 0, [])
    }

    const remoteLink: Link = container.resolve(
      ContainerRegistrationKeys.LINK
    )

    const links = input.links.map((link) => ({
      [Modules.PRODUCT]: { product_brand_id: link.brand_id },
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
