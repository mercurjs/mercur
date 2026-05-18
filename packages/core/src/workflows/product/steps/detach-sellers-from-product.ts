import { Link } from "@medusajs/framework/modules-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

export interface DetachSellersFromProductStepInput {
  links: {
    product_id: string
    seller_id: string
  }[]
}

export const detachSellersFromProductStepId = "detach-sellers-from-product"

export const detachSellersFromProductStep = createStep(
  detachSellersFromProductStepId,
  async (input: DetachSellersFromProductStepInput, { container }) => {
    if (!input.links?.length) {
      return new StepResponse(void 0, [])
    }

    const remoteLink: Link = container.resolve(
      ContainerRegistrationKeys.LINK
    )

    const links = input.links.map((link) => ({
      [Modules.PRODUCT]: { product_id: link.product_id },
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
