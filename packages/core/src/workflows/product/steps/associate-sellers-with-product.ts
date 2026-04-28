import { Link } from "@medusajs/framework/modules-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

export interface AssociateSellersWithProductStepInput {
  links: {
    product_id: string
    seller_id: string
  }[]
}

export const associateSellersWithProductStepId =
  "associate-sellers-with-product"

export const associateSellersWithProductStep = createStep(
  associateSellersWithProductStepId,
  async (
    input: AssociateSellersWithProductStepInput,
    { container }
  ) => {
    if (!input.links?.length) {
      return new StepResponse([], [])
    }

    const remoteLink: Link = container.resolve(
      ContainerRegistrationKeys.LINK
    )

    const links = input.links.map((link) => ({
      [Modules.PRODUCT]: { product_id: link.product_id },
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
