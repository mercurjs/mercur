import { Link } from "@medusajs/framework/modules-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

export type SellerRegionLink = {
  region_id: string
  seller_id: string
}

export interface AssociateSellersWithRegionsStepInput {
  links: SellerRegionLink[]
}

export const associateSellersWithRegionsStepId =
  "associate-sellers-with-regions"

export const associateSellersWithRegionsStep = createStep(
  associateSellersWithRegionsStepId,
  async (input: AssociateSellersWithRegionsStepInput, { container }) => {
    if (!input.links?.length) {
      return new StepResponse([], [])
    }

    const remoteLink: Link = container.resolve(ContainerRegistrationKeys.LINK)

    const links = input.links.map((link) => ({
      [Modules.REGION]: { region_id: link.region_id },
      [MercurModules.SELLER]: { seller_id: link.seller_id },
    }))

    const created = await remoteLink.create(links)
    return new StepResponse(created, links)
  },
  async (links, { container }) => {
    if (!links?.length) {
      return
    }

    const remoteLink: Link = container.resolve(ContainerRegistrationKeys.LINK)
    await remoteLink.dismiss(links)
  }
)
